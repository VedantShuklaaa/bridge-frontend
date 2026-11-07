import { NextResponse } from "next/server";
import { liveSnapshotSchema } from "@/lib/api/schemas";
import { serverConfig } from "@/lib/config";
import { createRateLimiter } from "@/lib/security";

const MAX_UPSTREAM_BYTES = 512 * 1024;
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 100;
const MAX_CURSOR_LENGTH = 512;

const NO_STORE = "no-store";
const LIVE_CACHE = "public, s-maxage=2, stale-while-revalidate=10";

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

/** Returns the parsed limit, or null when it is not an allowed integer. */
function parseLimit(raw: string | null): number | null {
  if (raw === null) {
    return DEFAULT_LIMIT;
  }

  if (!/^\d{1,3}$/.test(raw)) {
    return null;
  }

  const limit = Number.parseInt(raw, 10);
  return limit >= 1 && limit <= MAX_LIMIT ? limit : null;
}

/**
 * Returns the cursor unchanged, `undefined` when absent, or null when it is
 * malformed. The cursor is opaque; only its length and control characters are
 * rejected, and it is always re-encoded through `URLSearchParams`.
 */
function parseCursor(raw: string | null): string | null | undefined {
  if (raw === null || raw === "") {
    return undefined;
  }

  if (raw.length > MAX_CURSOR_LENGTH || /[\u0000-\u001f\u007f]/.test(raw)) {
    return null;
  }

  return raw;
}

export async function GET(request: Request) {
  const rate = limiter.check(clientKey(request));
  if (!rate.allowed) {
    return errorResponse(429, "Too many requests", {
      "Retry-After": String(rate.retryAfterSeconds),
    });
  }

  const { searchParams } = new URL(request.url);
  const limit = parseLimit(searchParams.get("limit"));
  const before = parseCursor(searchParams.get("before"));

  if (limit === null || before === null) {
    return errorResponse(400, "Invalid request");
  }

  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    serverConfig.apiTimeoutMs,
  );

  try {
    const params = new URLSearchParams({ limit: String(limit) });
    if (before !== undefined) {
      params.set("before", before);
    }

    let upstream: Response;
    try {
      upstream = await fetch(
        `${serverConfig.apiBaseUrl}/api/v2/transfers/live?${params.toString()}`,
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

    const parsed = liveSnapshotSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(502, "Unexpected upstream response");
    }

    return NextResponse.json(parsed.data, {
      headers: { "Cache-Control": LIVE_CACHE },
    });
  } finally {
    clearTimeout(timer);
  }
}
