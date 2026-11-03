// Base58 alphabet (Bitcoin/Solana), length 86-88 per the indexer's contract.
const SOLANA_SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{86,88}$/;

export function isValidSolanaSignature(value: unknown): value is string {
  return typeof value === "string" && SOLANA_SIGNATURE_PATTERN.test(value);
}

export const ALLOWED_CHAINS = ["solana"] as const;
export type AllowedChain = (typeof ALLOWED_CHAINS)[number];

export function isAllowedChain(value: unknown): value is AllowedChain {
  return (
    typeof value === "string" &&
    (ALLOWED_CHAINS as readonly string[]).includes(value)
  );
}

/**
 * Explorer hosts we are willing to link to. Extend by adding the bare hostname
 * (no scheme, no path). Every explorer link in the UI goes through
 * `safeExternalUrl`.
 */
export const EXPLORER_HOST_ALLOWLIST: ReadonlySet<string> = new Set([
  "solscan.io",
  "explorer.solana.com",
  "etherscan.io",
  "basescan.org",
  "arbiscan.io",
  "optimistic.etherscan.io",
  "polygonscan.com",
  "bscscan.com",
  "snowtrace.io",
  "celoscan.io",
  "wormholescan.io",
]);

/**
 * Returns the URL only when it is a credential-free `https:` URL on an
 * allowlisted explorer host; otherwise `null`.
 */
export function safeExternalUrl(
  value: string | null | undefined,
): string | null {
  if (!value) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:") {
    return null;
  }

  if (url.username !== "" || url.password !== "") {
    return null;
  }

  if (!EXPLORER_HOST_ALLOWLIST.has(url.hostname.toLowerCase())) {
    return null;
  }

  return url.toString();
}

/** Serialises JSON-LD with `<`, `>` and `&` escaped so it is safe in a script. */
export function serializeJsonLd(value: unknown): string {
  const json = JSON.stringify(value);

  if (json === undefined) {
    throw new TypeError("JSON-LD value must be JSON-serialisable");
  }

  return json
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/** Timestamps that are still inside the sliding window. Assumes ascending order. */
export function activeTimestamps(
  timestamps: readonly number[],
  now: number,
  windowMs: number,
): number[] {
  return timestamps.filter((timestamp) => timestamp > now - windowMs);
}

/** Pure sliding-window decision over the timestamps already inside the window. */
export function evaluateRateLimit(
  recent: readonly number[],
  now: number,
  { limit, windowMs }: RateLimitConfig,
): RateLimitResult {
  if (recent.length < limit) {
    // `recent` excludes the current request, so subtract one more for it.
    return {
      allowed: true,
      remaining: limit - recent.length - 1,
      retryAfterSeconds: 0,
    };
  }

  const oldest = recent[0] ?? now;
  const retryMs = Math.max(0, oldest + windowMs - now);

  return {
    allowed: false,
    remaining: 0,
    retryAfterSeconds: Math.max(1, Math.ceil(retryMs / 1000)),
  };
}

export type RateLimiter = {
  check(key: string): RateLimitResult;
};

/**
 * In-memory per-key sliding-window limiter.
 *
 * NOTE: this is per-process. It resets on deploy and does not coordinate
 * between instances; replace it with a shared store (Redis/Upstash) at scale.
 * `now` is injectable so the window is unit-testable.
 */
export function createRateLimiter(
  config: RateLimitConfig = { limit: 60, windowMs: 60_000 },
  now: () => number = Date.now,
): RateLimiter {
  if (config.limit <= 0 || config.windowMs <= 0) {
    throw new RangeError("Rate limit and window must be positive");
  }

  const buckets = new Map<string, number[]>();
  let checks = 0;

  return {
    check(key: string): RateLimitResult {
      const current = now();
      const recent = activeTimestamps(
        buckets.get(key) ?? [],
        current,
        config.windowMs,
      );
      const result = evaluateRateLimit(recent, current, config);

      if (result.allowed) {
        recent.push(current);
      }

      buckets.set(key, recent);

      // Bound memory: occasionally drop keys with no activity in the window.
      checks += 1;
      if (checks % 1_000 === 0) {
        for (const [bucketKey, timestamps] of buckets) {
          if (activeTimestamps(timestamps, current, config.windowMs).length === 0) {
            buckets.delete(bucketKey);
          }
        }
      }

      return result;
    },
  };
}
