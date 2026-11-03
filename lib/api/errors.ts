export type ApiErrorKind =
  | "invalid_input"
  | "not_found"
  | "rate_limited"
  | "unavailable"
  | "timeout"
  | "network"
  | "bad_response";

type ApiErrorOptions = {
  status?: number;
  cause?: unknown;
};

/** A failure the UI can switch on without reading upstream error text. */
export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number | undefined;

  constructor(kind: ApiErrorKind, message: string, options: ApiErrorOptions = {}) {
    super(
      message,
      options.cause === undefined ? undefined : { cause: options.cause },
    );
    this.name = "ApiError";
    this.kind = kind;
    this.status = options.status;
  }
}

/** Maps an HTTP status from our own `/api/analyse` route to an `ApiError`. */
export function apiErrorFromStatus(status: number): ApiError {
  switch (status) {
    case 400:
      return new ApiError(
        "invalid_input",
        "That transaction signature is not valid.",
        { status },
      );
    case 404:
      return new ApiError(
        "not_found",
        "No transaction was found for that signature.",
        { status },
      );
    case 429:
      return new ApiError(
        "rate_limited",
        "Too many requests. Try again shortly.",
        { status },
      );
    case 503:
      return new ApiError(
        "unavailable",
        "The indexer is temporarily unavailable.",
        { status },
      );
    case 504:
      return new ApiError("timeout", "The indexer took too long to respond.", {
        status,
      });
    default:
      return new ApiError(
        "bad_response",
        "The indexer returned an unexpected response.",
        { status },
      );
  }
}
