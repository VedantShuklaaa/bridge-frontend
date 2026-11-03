import { describe, expect, test } from "bun:test";
import {
  activeTimestamps,
  createRateLimiter,
  evaluateRateLimit,
  isValidSolanaSignature,
  safeExternalUrl,
  serializeJsonLd,
} from "./security";

const signatureOfLength = (length: number) => "1".repeat(length);

describe("isValidSolanaSignature", () => {
  test("accepts base58 signatures of 86 to 88 characters", () => {
    expect(isValidSolanaSignature(signatureOfLength(86))).toBe(true);
    expect(isValidSolanaSignature(signatureOfLength(87))).toBe(true);
    expect(isValidSolanaSignature(signatureOfLength(88))).toBe(true);
  });

  test("rejects wrong lengths and non-base58 characters", () => {
    expect(isValidSolanaSignature(signatureOfLength(85))).toBe(false);
    expect(isValidSolanaSignature(signatureOfLength(89))).toBe(false);
    expect(isValidSolanaSignature("0".repeat(88))).toBe(false);
    expect(isValidSolanaSignature("O".repeat(88))).toBe(false);
    expect(isValidSolanaSignature("I".repeat(88))).toBe(false);
    expect(isValidSolanaSignature("l".repeat(88))).toBe(false);
    expect(isValidSolanaSignature(" " + signatureOfLength(87))).toBe(false);
  });

  test("rejects non-strings", () => {
    expect(isValidSolanaSignature(null)).toBe(false);
    expect(isValidSolanaSignature(undefined)).toBe(false);
    expect(isValidSolanaSignature(123)).toBe(false);
    expect(isValidSolanaSignature({})).toBe(false);
  });
});

describe("safeExternalUrl", () => {
  test("accepts https URLs on allowlisted explorer hosts", () => {
    expect(safeExternalUrl("https://solscan.io/tx/abc")).toBe(
      "https://solscan.io/tx/abc",
    );
    expect(
      safeExternalUrl(
        "https://explorer.solana.com/tx/5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW",
      ),
    ).toBe(
      "https://explorer.solana.com/tx/5VERv8NMvzbJMEkV8xnrLkEaWRtSz9CosKDYjCJjBRnbJLgp8uirBgmQpjKhoR4tjF3ZpRzrFmBV6UjKdiSZkQUW",
    );
    expect(
      safeExternalUrl("https://wormholescan.io/#/tx/abc?network=Mainnet"),
    ).not.toBeNull();
    expect(safeExternalUrl("https://SOLSCAN.IO/tx/abc")).not.toBeNull();
  });

  test("rejects non-https, credentials, and unknown hosts", () => {
    expect(safeExternalUrl("http://solscan.io/tx/abc")).toBeNull();
    expect(safeExternalUrl("https://user:pass@solscan.io/tx/abc")).toBeNull();
    expect(safeExternalUrl("https://solscan.io.evil.example/tx/abc")).toBeNull();
    expect(safeExternalUrl("https://api.solscan.io/tx/abc")).toBeNull();
    expect(safeExternalUrl("https://evil.example/tx/abc")).toBeNull();
    expect(safeExternalUrl("javascript:alert(1)")).toBeNull();
    expect(safeExternalUrl("not a url")).toBeNull();
    expect(safeExternalUrl("")).toBeNull();
    expect(safeExternalUrl(null)).toBeNull();
    expect(safeExternalUrl(undefined)).toBeNull();
  });
});

describe("serializeJsonLd", () => {
  test("escapes characters that could break out of a script tag", () => {
    const serialised = serializeJsonLd({
      name: "<script>alert('x & y')</script>",
    });

    expect(serialised).not.toContain("<");
    expect(serialised).not.toContain(">");
    expect(serialised).toContain("\\u003c");
    expect(serialised).toContain("\\u003e");
    expect(serialised).toContain("\\u0026");
    expect(JSON.parse(serialised)).toEqual({
      name: "<script>alert('x & y')</script>",
    });
  });

  test("throws for values JSON cannot represent", () => {
    expect(() => serializeJsonLd(undefined)).toThrow(TypeError);
  });
});

describe("rate limiting helpers", () => {
  test("activeTimestamps keeps only entries inside the window", () => {
    expect(activeTimestamps([1_000, 2_000, 61_000], 61_000, 60_000)).toEqual([
      2_000, 61_000,
    ]);
    expect(activeTimestamps([], 61_000, 60_000)).toEqual([]);
  });

  test("evaluateRateLimit allows under the limit and reports the remainder", () => {
    expect(
      evaluateRateLimit([], 2_000, { limit: 2, windowMs: 60_000 }),
    ).toEqual({ allowed: true, remaining: 1, retryAfterSeconds: 0 });
    expect(
      evaluateRateLimit([1_000], 2_000, { limit: 2, windowMs: 60_000 }),
    ).toEqual({ allowed: true, remaining: 0, retryAfterSeconds: 0 });
  });

  test("evaluateRateLimit rejects at the limit with a retry hint", () => {
    expect(
      evaluateRateLimit([5_000, 6_000], 7_000, {
        limit: 2,
        windowMs: 60_000,
      }),
    ).toEqual({ allowed: false, remaining: 0, retryAfterSeconds: 58 });
  });

  test("createRateLimiter applies a sliding window per key", () => {
    let now = 0;
    const limiter = createRateLimiter(
      { limit: 2, windowMs: 1_000 },
      () => now,
    );

    expect(limiter.check("a")).toEqual({
      allowed: true,
      remaining: 1,
      retryAfterSeconds: 0,
    });

    now = 100;
    expect(limiter.check("a").allowed).toBe(true);

    now = 200;
    expect(limiter.check("a")).toEqual({
      allowed: false,
      remaining: 0,
      retryAfterSeconds: 1,
    });
    expect(limiter.check("b").allowed).toBe(true);

    now = 1_001;
    expect(limiter.check("a").allowed).toBe(true);
  });

  test("createRateLimiter rejects an invalid configuration", () => {
    expect(() => createRateLimiter({ limit: 0, windowMs: 1_000 })).toThrow(
      RangeError,
    );
    expect(() => createRateLimiter({ limit: 1, windowMs: 0 })).toThrow(
      RangeError,
    );
  });
});
