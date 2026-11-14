import { publicConfig } from "@/lib/config.public";
import { ApiError, apiErrorFromStatus } from "./errors";
import { transferListSchema, type TransferList } from "./schemas";

const LIST_TIMEOUT_MS = 8_000;
const DEFAULT_LIMIT = 100;

/**
 * Calls our own `/api/transfers` route handler, never the indexer directly.
 *
 * In the browser the request stays on the current origin, prefixed with the
 * app's `basePath` so it reaches the route handler. On the server the route
 * needs an absolute URL.
 */
function transfersUrl(limit: number, cursor: string | null): string {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor !== null) {
    params.set("cursor", cursor);
  }

  const path = `/api/transfers?${params.toString()}`;

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

export type FetchTransfersOptions = {
  limit?: number;
  /** `next_cursor` from the previous page; `null` starts at the newest row. */
  cursor?: string | null;
  signal?: AbortSignal;
};

/**
 * Fetches one keyset page of transfers. Any failure throws an `ApiError`; the
 * feed keeps its current rows and retries on the next poll.
 */
export async function fetchTransfers({
  limit = DEFAULT_LIMIT,
  cursor = null,
  signal,
}: FetchTransfersOptions = {}): Promise<TransferList> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LIST_TIMEOUT_MS);
  const onAbort = () => controller.abort();

  if (signal?.aborted) {
    clearTimeout(timer);
    throw new ApiError("timeout", "The transfers request was cancelled.");
  }

  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    let response: Response;

    try {
      response = await fetch(transfersUrl(limit, cursor), {
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiError("timeout", "The transfers request took too long.", {
          cause: error,
        });
      }

      throw new ApiError("network", "Could not reach the transfers feed.", {
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
      throw new ApiError("bad_response", "The transfers feed was invalid.", {
        cause: error,
        status: response.status,
      });
    }

    const parsed = transferListSchema.safeParse(body);
    if (!parsed.success) {
      throw new ApiError("bad_response", "The transfers feed was invalid.", {
        cause: parsed.error,
        status: response.status,
      });
    }

    return parsed.data;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }
}
