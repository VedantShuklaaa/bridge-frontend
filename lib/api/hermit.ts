export const HERMIT = {
  name: "hermit",
  path: "~/projects/hermit",
  title: "Solana bridge transaction indexer",
  intro:
    "Decodes bridge activity straight from Solana data, in both directions, and streams every transfer live. Rust, Postgres, Redis Streams.",
  repo: "https://github.com/VedantShuklaaa/hermit",
  home: "https://projects.vedantshukla.in",
} as const;

export const PIPELINE = [
  { id: "01", title: "Subscribe", detail: "logsSubscribe on the bridge program over a Helius WebSocket, with a ping keepalive, a watchdog and a rewound checkpoint on reconnect." },
  { id: "02", title: "Queue", detail: "Candidates go to a Redis Stream. Consumer groups and XAUTOCLAIM give at-least-once delivery without a second system to run." },
  { id: "03", title: "Decode", detail: "Workers fetch the transaction and run a pure protocol adapter: classify, decode, or reject with a reason." },
  { id: "04", title: "Persist", detail: "Stored as Detected from on-chain data alone. Upserts on (protocol, message_key) make redelivery harmless." },
  { id: "05", title: "Enrich", detail: "Protocol APIs such as WormholeScan fill in the destination tx and final status in the background. They never gate persistence." },
  { id: "06", title: "Serve", detail: "Versioned REST, a keyset-paginated transfer list and a live WebSocket stream." },
] as const;

export const STATUS_FLOW = [
  { label: "Detected", caption: "decoded from Solana data" },
  { label: "Pending", caption: "matching VAA found" },
  { label: "Completed", caption: "destination tx known" },
] as const;

export const METRICS = [
  { value: 100, decimals: 0, suffix: "%", label: "recall", detail: "594 of 594 signatures persisted over a clean 24 h window, 0 missed" },
  { value: 3, decimals: 0, suffix: "s", label: "p99 ingestion lag", detail: "block time to stored, same window, max 11 s" },
  { value: 156.8, decimals: 1, suffix: "k", label: "req/s, warm reads", detail: "/analyse cache hit, p99 0.50 ms, 2 vCPU server" },
  { value: 1.6, decimals: 1, suffix: "k", label: "req/s, transfer list", detail: "keyset pagination, p99 66 ms on about 7k rows" },
] as const;

export const METRICS_NOTE =
  "Recall and lag: reconcile run against getSignaturesForAddress, 2026-11-05 to 06, on EC2. Reads: R-hit, 50 connections, m7i-flex.large. List: L-first, same host.";

export const FEATURES = [
  { title: "Chain first", text: "A transfer is persisted from Solana data alone. WormholeScan only enriches it, so an outage upstream never blocks or loses a transfer." },
  { title: "Both directions", text: "Sends out of Solana and redeems into it, decoded from the posted VAA account with an in-house parser." },
  { title: "Protocol adapters", text: "One pure adapter per protocol declares its programs and decodes or rejects. Wormhole (Portal and NTT), CCTP, deBridge and Mayan today, one protocol per phase after." },
  { title: "Exactly-once writes", text: "At-least-once delivery plus idempotent upserts. Transient failures stay pending, permanent ones go to a dead-letter stream." },
  { title: "Self-healing stream", text: "Watchdog, checkpoint rewind, concurrent backfill, and a periodic reconcile poll as the safety net behind the WebSocket." },
  { title: "Unknown is not an error", text: "An unrecognised chain is stored as unresolved, never dropped, and resolves later when the registry learns it." },
] as const;

export const ENDPOINTS = [
  { method: "GET", path: "/api/v1/transactions/analyse?transaction_hash=<sig>&chain=solana", note: "frozen response" },
  { method: "GET", path: "/api/v2/transactions/analyse?transaction_hash=<sig>&chain=solana", note: "generalised model" },
  { method: "GET", path: "/api/v2/transfers?direction=Inbound&status=Completed&limit=50", note: "keyset pagination" },
  { method: "WS", path: "/api/v1/transactions/stream", note: "live transfers" },
] as const;

export const ROADMAP = [
  { done: true, text: "Wormhole Token Bridge: sends and redeems" },
  { done: true, text: "Chain-first detection, WormholeScan only enriches" },
  { done: true, text: "Always-on ingestion: watchdog, rewind, concurrent backfill" },
  { done: true, text: "Reconcile tool and a periodic poll as a safety net" },
  { done: true, text: "Versioned API: v1 frozen, v2 generalised model and transfer list" },
  { done: false, text: "Other Wormhole programs on Solana (NTT and more)" },
  { done: false, text: "One protocol per phase after that, ranked by Solana bridge volume" },
  { done: false, text: "Hostnames, CI/CD and a Helius key per role" },
] as const;