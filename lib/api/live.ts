import { publicConfig } from "@/lib/config.public";
import { ApiError, apiErrorFromStatus } from "./errors";
import { liveSnapshotSchema, type LiveSnapshot } from "./schemas";

const SNAPSHOT_TIMEOUT_MS = 5_000;
const DEFAULT_LIMIT = 100;

/**
 * Calls our own `/api/live` route handler, never the indexer directly.
 *
 * In the browser the request stays on the current origin, prefixed with the
 * app's `basePath` so it reaches the route handler. On the server the route
 * needs an absolute URL.
 */
function liveUrl(limit: number): string {
  const params = new URLSearchParams({ limit: String(limit) });
  const path = `/api/live?${params.toString()}`;

  if (typeof window !== "undefined") {
    // Inlined at build time by Next from `basePath` in next.config.ts.
    const basePath = process.env.__NEXT_ROUTER_BASEPATH ?? "";
    return `${basePath}${path}`;
  }

  return new URL(
    path.replace(/^\/+/, ""),
    `${publicConfig.siteUrl}/`,
  ).toString();
}

/** Our proxy's machine-readable error body. */
async function errorCode(response: Response): Promise<string | undefined> {
  try {
    const body: unknown = await response.json();

    if (
      typeof body === "object" &&
      body !== null &&
      "error" in body &&
      typeof body.error === "string"
    ) {
      return body.error;
    }

    return undefined;
  } catch {
    return undefined;
  }
}

/**
 * A shared cache may serve a response generated up to `s-maxage` seconds ago.
 * `server_time` is from that moment, so add the response's `Age` before using
 * it as the current server clock.
 */
function cacheAgeMs(response: Response): number {
  const age = Number.parseInt(response.headers.get("age") ?? "", 10);

  return Number.isFinite(age) && age > 0 ? age * 1000 : 0;
}

/**
 * Fetches the bounded global snapshot. Any failure throws an `ApiError`; the
 * provider decides whether to retry or silently fall back to the WebSocket.
 */
export async function fetchLiveSnapshot(
  signal?: AbortSignal,
  limit = DEFAULT_LIMIT,
): Promise<LiveSnapshot> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SNAPSHOT_TIMEOUT_MS);
  const onAbort = () => controller.abort();

  if (signal?.aborted) {
    clearTimeout(timer);
    throw new ApiError("timeout", "The live snapshot request was cancelled.");
  }

  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    let response: Response;

    try {
      response = await fetch(liveUrl(limit), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiError("timeout", "The live snapshot took too long.", {
          cause: error,
        });
      }

      throw new ApiError("network", "Could not reach the live snapshot.", {
        cause: error,
      });
    }

    if (!response.ok) {
      throw apiErrorFromStatus(response.status, await errorCode(response));
    }

    let body: unknown;
    try {
      body = await response.json();
    } catch (error) {
      throw new ApiError(
        "bad_response",
        "The live snapshot was invalid.",
        { cause: error, status: response.status },
      );
    }

    const parsed = liveSnapshotSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError(
        "bad_response",
        "The live snapshot was invalid.",
        { cause: parsed.error, status: response.status },
      );
    }

    return {
      ...parsed.data,
      // Only bridge transfers belong in the feed; the socket hook applies the
      // same rule to WS frames.
      items: parsed.data.items.filter((item) => item.bridge_transfer !== null),
      server_time: parsed.data.server_time + cacheAgeMs(response),
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
