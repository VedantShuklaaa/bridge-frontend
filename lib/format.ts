import type { ChainId } from "@/types/hermit";

/** The chain label, or `Unknown(<id>)` for the object variant. */
export function formatChain(chain: ChainId): string {
  return typeof chain === "string" ? chain : `Unknown(${chain.Unknown})`;
}

/** Trims a long identifier to `head…tail`. */
export function shortHash(value: string, head = 6, tail = 6): string {
  if (value.length <= head + tail + 1) {
    return value;
  }

  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** `12s`, `3m`, `2h`, `5d`. Negative spans clamp to zero. */
export function formatElapsed(fromMs: number, nowMs: number): string {
  const seconds = Math.max(0, Math.floor((nowMs - fromMs) / 1000));

  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }

  return `${Math.floor(hours / 24)}d`;
}

/** Relative label for a unix-seconds timestamp: `5d ago`. */
export function formatRelative(timestampSeconds: number, nowMs: number): string {
  return `${formatElapsed(timestampSeconds * 1000, nowMs)} ago`;
}

/** Local date and time for a unix-seconds timestamp, or null when unusable. */
export function formatDateTime(timestampSeconds: number): string | null {
  const date = new Date(timestampSeconds * 1000);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

/** Local date and time plus a relative suffix, or null when unusable. */
export function formatBlockTime(
  timestampSeconds: number,
  nowMs: number,
): string | null {
  const timestamp = formatDateTime(timestampSeconds);

  return timestamp === null
    ? null
    : `${timestamp} (${formatRelative(timestampSeconds, nowMs)})`;
}

/** Lamports to SOL with nine decimals. The division never mutates the source. */
export function formatSol(feeLamports: number): string {
  return (feeLamports / 1_000_000_000).toFixed(9);
}
