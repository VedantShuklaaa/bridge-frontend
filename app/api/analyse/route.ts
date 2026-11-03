import { NextResponse } from "next/server";
import { transactionResponseSchema } from "@/lib/api/schemas";
import { serverConfig } from "@/lib/config";
import {
  createRateLimiter,
  isAllowedChain,
  isValidSolanaSignature,
} from "@/lib/security";

const MAX_UPSTREAM_BYTES = 512 * 1024;
const NO_STORE = "no-store";
const COMPLETE_CACHE = "public, s-maxage=60, stale-while-revalidate=300";

// Per-process only: resets on deploy and is not shared between instances.
// TODO(scale): move to a shared store (Redis/Upstash) before horizontal scale.
const limiter = createRateLimiter({ limit: 60, windowMs: 60_000 });

function errorResponse(
  status: number,
  message: string,
  extraHeaders?: Record<string, string>,
) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": NO_STORE, ...extraHeaders },
    },
  );
}

/** Best-effort client identity behind a proxy; never trusted for anything else. */
function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "anonymous";
}

/** Reads at most `maxBytes`; returns null when the body exceeds the cap. */
async function readCapped(
  response: Response,
  maxBytes: number,
): Promise<string | null> {
  const declared = response.headers.get("content-length");
  if (declared !== null) {
    const length = Number(declared);
    if (Number.isFinite(length) && length > maxBytes) {
      return null;
    }
  }

  if (!response.body) {
    return "";
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return new TextDecoder().decode(bytes);
}

export async function GET(request: Request) {
  const rate = limiter.check(clientKey(request));
  if (!rate.allowed) {
    return errorResponse(429, "Too many requests", {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  const { searchParams } = new URL(request.url);
  const hash = searchParams.get("transaction_hash");
  const chain = searchParams.get("chain") ?? "solana";

  if (!isValidSolanaSignature(hash) || !isAllowedChain(chain)) {
    return errorResponse(400, "Invalid request");
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    serverConfig.apiTimeoutMs,
  );

  try {
    let upstream: Response;
    try {
      const params = new URLSearchParams({ transaction_hash: hash, chain });
      upstream = await fetch(
        `${serverConfig.apiBaseUrl}/api/v2/analyse?${params}`,
        {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        },
      );
    } catch {
      return controller.signal.aborted
        ? errorResponse(504, "Upstream timed out")
        : errorResponse(503, "Service unavailable");
    }

    if (!upstream.ok) {
      if (upstream.status === 404) {
        return errorResponse(404, "Not found");
      }

      if (upstream.status === 429) {
        const headers: Record<string, string> = {};
        const retryAfter = upstream.headers.get("retry-after")?.trim();
        if (retryAfter && /^\d{1,6}$/.test(retryAfter)) {
          headers["Retry-After"] = retryAfter;
        }
        return errorResponse(429, "Too many requests", headers);
      }

      if (upstream.status >= 500) {
        return errorResponse(503, "Service unavailable");
      }

      return errorResponse(502, "Unexpected upstream response");
    }

    let text: string | null;
    try {
      text = await readCapped(upstream, MAX_UPSTREAM_BYTES);
    } catch {
      return controller.signal.aborted
        ? errorResponse(504, "Upstream timed out")
        : errorResponse(502, "Unexpected upstream response");
    }

    if (text === null) {
      return errorResponse(502, "Unexpected upstream response");
    }

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return errorResponse(502, "Unexpected upstream response");
    }

    const parsed = transactionResponseSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(502, "Unexpected upstream response");
    }

    const complete =
      parsed.data.transfers.length > 0 &&
      parsed.data.transfers.every((transfer) => transfer.status === "Completed");

    return NextResponse.json(parsed.data, {
      headers: { "Cache-Control": complete ? COMPLETE_CACHE : NO_STORE },
    });
  } finally {
    clearTimeout(timer);
  }
}
