import { publicConfig } from "@/lib/config.public";
import { ApiError, apiErrorFromStatus } from "./errors";
import {
  transactionResponseSchema,
  type TransactionResponse,
} from "./schemas";

const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RESPONSE_CHARS = 1_000_000;

/**
 * Reads one transaction from the indexer's v2 analyse endpoint for a direct
 * link or a hard refresh, when the live store has no entry for the hash.
 *
 * The endpoint returns `TransactionResponse`, not a stream frame; callers map
 * what fits and keep the rest in the raw JSON section.
 */
export async function fetchHermitAnalysis(
  hash: string,
  signal?: AbortSignal,
): Promise<TransactionResponse> {
  const params = new URLSearchParams({
    transaction_hash: hash,
    chain: "solana",
  });
  const url = `${publicConfig.apiUrl}/api/v2/transactions/analyse?${params.toString()}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const forwardAbort = () => controller.abort();

  signal?.addEventListener("abort", forwardAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(url, {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
  } catch (error) {
    if (signal?.aborted) {
      throw new ApiError("timeout", "The request was cancelled.", {
        cause: error,
      });
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("timeout", "The indexer took too long to respond.", {
        cause: error,
      });
    }
    throw new ApiError("network", "Could not reach the indexer.", {
      cause: error,
    });
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", forwardAbort);
  }

  if (!response.ok) {
    throw apiErrorFromStatus(response.status);
  }

  let text: string;
  try {
    text = await response.text();
  } catch (error) {
    throw new ApiError("network", "Could not read the indexer response.", {
      cause: error,
      status: response.status,
    });
  }

  if (text.length > MAX_RESPONSE_CHARS) {
    throw new ApiError(
      "bad_response",
      "The indexer returned an unexpectedly large response.",
      { status: response.status },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch (error) {
    throw new ApiError(
      "bad_response",
      "The indexer returned an unexpected response.",
      { cause: error, status: response.status },
    );
  }

  const parsed = transactionResponseSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(
      "bad_response",
      "The indexer returned an unexpected response.",
      { cause: parsed.error, status: response.status },
    );
  }

  return parsed.data;
}
