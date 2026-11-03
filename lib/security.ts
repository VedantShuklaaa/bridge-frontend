// Base58 alphabet (Bitcoin/Solana), length 86-88 per the indexer's contract.
const SOLANA_SIGNATURE_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{86,88}$/;

export function isValidSolanaSignature(value: unknown): value is string {
  return typeof value === "string" && SOLANA_SIGNATURE_PATTERN.test(value);
}

// TODO(foundation): safeExternalUrl, serializeJsonLd, chain allowlist and the
// rate limiter are added with the proxy/security chunk.
