import { z } from "zod";
import { publicConfig } from "@/lib/config.public";
import { ApiError, apiErrorFromStatus } from "./errors";
import { transactionResponseSchema, type TransactionResponse } from "./schemas";

/**
 * Our proxy's machine-readable error body. Only the code is used; the human
 * copy comes from `errors.ts`, never from the response text.
 */
const errorBodySchema = z.object({ error: z.string() });

async function errorCode(response: Response): Promise<string | undefined> {
  try {
    const parsed = errorBodySchema.safeParse(await response.json());
    return parsed.success ? parsed.data.error : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Calls our own `/api/analyse` route handler, never the indexer directly.
 *
 * On the server the route needs an absolute URL, so it is built from
 * NEXT_PUBLIC_SITE_URL. In the browser a relative URL keeps the request on the
 * current origin.
 */
function analyseUrl(hash: string): string {
  const params = new URLSearchParams({
    transaction_hash: hash,
    chain: "solana",
  });
  const path = `/api/analyse?${params.toString()}`;

  if (typeof window !== "undefined") {
    return path;
  }

  return new URL(
    path.replace(/^\/+/, ""),
    `${publicConfig.siteUrl}/`,
  ).toString();
}

export async function fetchAnalysis(
  hash: string,
  signal?: AbortSignal,
): Promise<TransactionResponse> {
  let response: Response;

  try {
    response = await fetch(analyseUrl(hash), {
      cache: "no-store",
      headers: { Accept: "application/json" },
      signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new ApiError("timeout", "The request took too long.", {
        cause: error,
      });
    }
    throw new ApiError("network", "Could not reach the indexer.", {
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
