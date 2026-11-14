import type { Section } from "./types";
import { code, p, table, ul } from "./blocks";

const group = "Internals";

export const internals: Section[] = [
	{
		slug: "architecture",
		group,
		title: "Architecture",
		description:
			"How Hermit's pipeline is built: ingestion, Redis Streams, workers, adapters, enrichment, Postgres and the WebSocket feed, plus the api and stream role split.",
		intro: [
			p("Every successfully analysed transaction is persisted to Postgres and, in the same step, broadcast to connected WebSocket clients. The live feed and the durable record come from one source of truth, not two paths that can drift."),
		],
		subs: [
			{
				id: "current-pipeline",
				title: "Current pipeline (v0)",
				blocks: [
					code(
						`Solana WS logsSubscribe
  -> Solana Ingester
  -> Redis Stream: bridge:transactions        (XADD)
  -> Workers 1..5
       -> Analyse: Helius + WormholeScan + VAA decode
       -> Postgres
       -> on success: broadcast channel -> WS clients (/api/v1/transactions/stream)
       -> on failure: dead-letter stream

Recovery worker --XAUTOCLAIM--> Redis Stream`,
						"flow",
					),
					p("The ingester does not wait for a `/stream` client. It runs from startup under a supervisor."),
				],
			},
			{
				id: "target-pipeline",
				title: "Target pipeline (Phase A)",
				blocks: [
					p("Detection and decoding use Solana data only. Enrichment runs after the transfer is stored, and a failed or empty enrichment never blocks persistence."),
					code(
						`Solana logsSubscribe (one per program ID)
  -> Ingester -> Redis Stream -> Workers
  -> Fetch tx and adapter accounts (Helius)
  -> Route by program ID
  -> Protocol adapters: classify and decode (pure)
       rejected -> counted by reason, acked
  -> Compose: one transfer per message identity, via recorded
  -> Chain registry: resolve or unresolved
  -> Postgres (Detected)
       -> Broadcast -> WS clients
       -> Enrichment providers (WormholeScan, ...)
            -> destination tx, status -> Postgres

infra failure -> dead-letter stream`,
						"flow",
					),
				],
			},
			{
				id: "roles",
				title: "Roles after Phase 2",
				blocks: [
					p("Helius rate limits are per key, so the user-facing read path and the ingestion pipeline must not share one. The same binary runs in two roles with separate Helius keys, limiters and hostnames. `ROLE=all` stays available for local development."),
					code(
						`api.<domain>     ROLE=api, Helius key A
  GET /analyse -> read-through cache -> limiter A -> Helius, WormholeScan

stream.<domain>  ROLE=stream, Helius key B
  Ingester + poll -> Redis Stream -> Workers -> limiter B
  Workers -> Postgres
  Workers -> broadcast -> WS /stream

Shared: Postgres, Redis`,
						"roles",
					),
				],
			},
			{
				id: "why-redis-streams",
				title: "Why Redis Streams, not Kafka",
				blocks: [
					p("Consumer groups plus `XAUTOCLAIM` give at-least-once delivery, per-worker ack tracking and automatic redelivery of stuck messages, without a second infrastructure dependency to operate."),
					p("Kafka would be the right call at higher throughput or with several independent consumer applications. For a single-service pipeline at this scale it adds operational cost for guarantees Redis Streams already provides."),
				],
			},
		],
	},

	{
		slug: "data-model",
		group,
		title: "Domain model and chain registry",
		description:
			"How Hermit stores transfers: protocol-agnostic bridge_transfers, per-protocol detail tables, message identity, NUMERIC amounts and the DB-backed chain registry.",
		intro: [
			p("Storage is split into a protocol-agnostic `bridge_transfers` table and one detail table per protocol. Chains are data, not code."),
		],
		subs: [
			{
				id: "transfers",
				title: "Transfers",
				blocks: [
					p("A transfer carries `protocol`, an optional `via` (outer router), `direction`, source and destination chain references, a protocol-specific message identity, wallets, token, amount and a status."),
					p("Statuses are `Detected`, `Pending` and `Completed`, plus `Failed` and `Refunded` where a protocol needs them."),
				],
			},
			{
				id: "storage",
				title: "Storage",
				blocks: [
					ul(
						"`bridge_transfers` is protocol-agnostic. Each protocol gets one detail table (`wormhole_messages` today).",
						"A transfer's identity is `UNIQUE (protocol, message_key)`.",
						"`observed_tx_hash` is the Solana tx the transfer was decoded from and `event_index` its position there, so one tx can hold several transfers.",
					),
				],
			},
			{
				id: "message-identity",
				title: "Message identity",
				blocks: [
					p("`MessageId` is protocol-tagged, with one variant per wired protocol: Wormhole, CCTP, deBridge and Mayan. `MessageId::key()` is the canonical string stored as `bridge_transfers.message_key`."),
					p("Identities differ per protocol: Wormhole emitter and sequence, CCTP source domain and nonce, deBridge order ID, Mayan order hash, and a LayerZero GUID where that adapter lands."),
				],
			},
			{
				id: "amounts",
				title: "Amounts",
				blocks: [
					p("Amounts are `RawAmount`, a decimal string validated for `NUMERIC(78,0)`, which fits a `u256`. During the A2 migration an amount that was not a plain integer became NULL; the full value stays in `analysis`."),
				],
			},
			{
				id: "chain-registry",
				title: "Chain registry",
				blocks: [
					p("Chains live in a canonical `chains` table plus a `(protocol, protocol_chain_id) -> chain` mapping table, because every protocol numbers chains differently (Wormhole chain IDs, CCTP domains, LayerZero endpoint IDs, EVM chain IDs, deBridge IDs)."),
					ul(
						"Adapters emit a `RawChainRef` in the protocol's own namespace. `chains::Snapshot` resolves it to a canonical chain or to `ChainRef::Unresolved`, never an error.",
						"Only `active` rows resolve, and a mapping must point at an active chain, so a `pending_review` proposal can never label a real transfer.",
						"The registry loads at startup and refreshes every `CHAIN_REGISTRY_REFRESH_SECS` (default 60, minimum 5), so a manual `INSERT` or `UPDATE` takes effect without a restart.",
						"The migration seeds the 10 current chains plus the `wormhole` and `evm` namespaces. Each mapping row carries `status`, `origin` (`seed`, `manual`, `llm`), `evidence` and `verified_at`.",
					),
				],
			},
			{
				id: "unknown-chains",
				title: "Unknown chain resolution (later)",
				blocks: [
					p("Designed now, built later. An unresolved ID can be looked up with a free LLM API. The answer is a proposal, never a fact."),
					ul(
						"It enters the registry as `pending_review` and activates only when cross-checked against an authoritative source (Wormhole chain list, Circle's CCTP domain list, LayerZero endpoint metadata).",
						"Lookups are rate-limited and cached, one per unresolved `(protocol, id)`, with a negative cache.",
						"Activating a mapping resolves the transfers already stored as `unresolved` for that `(protocol, id)`.",
					),
				],
			},
			{
				id: "migrations",
				title: "Migrations",
				blocks: [
					p("Migrations run on startup and are embedded at compile time. The A2 migration rewrote existing rows in place: every legacy row became `protocol = 'wormhole'`, `direction = 'Outbound'`, with the same message key `MessageId::key()` builds."),
					p("Two repair migrations fix rows the old path stored like sends: redeems become `Inbound` with the redeem as destination tx, and inbound rows lose the Solana signer stored as source wallet. Their cached analysis is dropped so the next read rebuilds it."),
					p("There is no down migration. Snapshot the database before deploying."),
				],
			},
		],
	},

	{
		slug: "detection",
		group,
		title: "Detection and enrichment",
		description:
			"How Hermit turns Solana transactions into transfers: adapters, routing, Wormhole outbound and inbound decoding, and WormholeScan enrichment.",
		intro: [
			p("Detection is pure and runs on Solana data. Enrichment is a separate step that fills in what the chain cannot say on its own."),
		],
		subs: [
			{
				id: "adapters",
				title: "Adapters",
				blocks: [
					p("`BridgeAdapter` is pure: `classify(&SolanaTx)` returns either the transfers it contains or a `Reject` of kind `not_transfer`, `unsupported` or `malformed`, with a reason. Nothing is guessed."),
					p("Adapters declare the extra accounts they need through `required_accounts` (default none). `analyse_tx` reads them with one `getMultipleAccounts` call through the Helius limiter into `SolanaTx::accounts`."),
				],
			},
			{
				id: "routing-and-composition",
				title: "Routing and composition",
				blocks: [
					p("`ProtocolRegistry` routes a transaction to every adapter whose program appears top-level or in an inner instruction, so an aggregator and its underlying rail both see it. `compose()` merges them into one transfer with `via` recorded."),
				],
			},
			{
				id: "wormhole-outbound",
				title: "Wormhole outbound",
				blocks: [
					p("`WormholeAdapter` decodes Token Bridge sends (`transfer_native`, `transfer_wrapped` and the with-payload variants) from the transaction alone."),
					ul(
						"The Token Bridge CPIs the core bridge `PostMessage`. Its instruction data carries the payload: amount, token, recipient, destination chain.",
						"The emitter account and the `Sequence: N` log give the message identity.",
						"A tx with `meta.err` set, a log or instruction mismatch, or a bad payload is rejected with a reason.",
						"The amount is the VAA amount (at most 8 decimals).",
					),
				],
			},
			{
				id: "wormhole-inbound",
				title: "Wormhole inbound redeems",
				blocks: [
					p("`complete_native`, `complete_wrapped` and the with-payload variants carry no instruction data. The message they redeem is the posted VAA account: the third account of the instruction, owned by the core bridge."),
					ul(
						"The adapter decodes identity and transfer from that account with an in-house parser (`protocols/wormhole/posted_vaa.rs`), with no external dependency.",
						"It checks the account is owned by the core bridge and the payload is a transfer addressed to Solana.",
						"A redeem without its account loaded is `Unsupported`. Any other mismatch is `Malformed`.",
						"A redeem decodes to the same `(protocol, message_key)` as the send it redeems, with `direction = Inbound` and no source wallet.",
					),
				],
			},
			{
				id: "inbound-rows",
				title: "Inbound rows",
				blocks: [
					ul(
						"A redeem's Solana tx is the destination side. `observed_tx_hash` and `destination_tx_hash` are both the redeem signature, `source_tx_hash` is NULL, and status is `Completed` straight away.",
						"The origin tx is filled in by enrichment: from the matched WormholeScan operation's source transaction, otherwise from the message-key `/vaas/{emitterChain}/{emitterAddress}/{sequence}` record.",
						"A later analysis that cannot reach WormholeScan never erases a known origin tx.",
						"EVM hashes arrive as bare hex and get the `0x` prefix from the chain registry.",
						"In the frozen `/api/v1` response `source_tx_hash` is nullable, and null only for a redeem whose origin tx is not known yet.",
					),
				],
			},
			{
				id: "enrichment",
				title: "Enrichment",
				blocks: [
					p("WormholeScan sits behind the `EnrichmentProvider` trait in `enrichment/`. It never gates persistence."),
					ul(
						"`detect` turns adapter output into the API `BridgeTransfer` with status `Detected`, then raises it: `Pending` when a matching VAA exists, `Completed` when the destination tx is known.",
						"No VAA, a failed WormholeScan call, or a VAA for another message leaves the transfer `Detected`.",
						"The destination tx is read from the `/operations` payload (`targetChain.transaction.txHash`, legacy paths as fallback), then `/global-tx` through the WormholeScan limiter.",
						"Token symbol and decimals are a best-effort lookup with a 2 s timeout.",
					),
				],
			},
			{
				id: "status-rules",
				title: "Status rules",
				blocks: [
					p("A status never moves backwards: `Completed` stays, and `Pending` is not overwritten by `Detected`. The cached analysis follows the same rule."),
					table(
						["Situation", "Status"],
						[
							["Decoded on chain, no VAA", "`Detected`"],
							["Matching VAA, no destination tx", "`Pending`"],
							["Matching VAA and destination tx", "`Completed`"],
							["VAA for another message (even with a destination tx)", "`Detected`"],
							["Inbound redeem", "`Completed` at detection"],
						],
						"Status rules",
					),
				],
			},
		],
	},

	{
		slug: "read-path",
		group,
		title: "Read path",
		description:
			"How GET /analyse stays fast: validation, memory cache, single-flight, Postgres, stale-while-revalidate, rate limiting and a concurrency cap.",
		intro: [
			p("A cold analysis is expensive: Helius and WormholeScan are called in parallel, the VAA is decoded and the transfer is correlated with its destination chain (about 360 ms median, and both providers rate-limit). The read path exists so almost no request pays that cost."),
		],
		subs: [
			{
				id: "request-flow",
				title: "Request flow",
				blocks: [
					code(
						`GET /analyse
  -> valid hash and chain?   no  -> 400 (no cache or upstream touched)
  -> memory cache            hit -> respond
  -> per-key single-flight lock
  -> Postgres analysis       fresh -> respond
                             stale -> respond + background refresh
  -> cold fetch (upstream permit, 16 concurrent max)
       Helius (limiter, retry) + WormholeScan (limiter, retry)
  -> correlate and persist   -> respond
  -> on error: negative cache`,
						"flow",
					),
				],
			},
			{
				id: "layers",
				title: "Layers",
				blocks: [
					table(
						["Layer", "What it does"],
						[
							["Hash validation", "Rejects anything that is not a 64-byte base58 Solana signature, and any source chain other than Solana, with a 400."],
							["Memory cache", "`completed` 10 min, `open` (Pending/Detected) 15 s, `not_found` 30 s, transient failures 10 s."],
							["Single-flight lock", "One request per `(chain, transaction hash)` does the work. 50 concurrent requests for one uncached hash cause 1 upstream fetch."],
							["Postgres", "`bridge_transfers.analysis` holds the last analysis. Completed is always fresh; Pending and Detected are fresh for 60 s."],
							["Stale-while-revalidate", "A stale row is served immediately and refreshed in the background (max 8 at once, 15 s cooldown per key)."],
							["Rate limiting", "One `governor` limiter per provider. A call waits at most 2 s for a token, then fails fast with a 503."],
							["Retries", "429, timeout and 502 retry up to 3 times with exponential backoff and jitter, each attempt going back through the limiter."],
							["Concurrency cap", "A semaphore bounds concurrent cold fetches (16). Waiting for a permit times out after 2 s with a 503."],
						],
						"Read path layers",
					),
				],
			},
			{
				id: "tuning",
				title: "Tuning",
				blocks: [
					table(
						["Setting", "Default"],
						[
							["Freshness window for non-Completed rows (`FRESH_SECS`)", "60 s"],
							["Failed-analysis negative cache TTL (`FAILED_CACHE_TTL_SECS`)", "10 s"],
							["Max background refreshes (`MAX_BACKGROUND_REFRESHES`)", "8"],
							["Provider quotas", "Helius 6/s (API) and 4/s (ingest) to fit the free plan's 10/s while both lanes share one key; WormholeScan 20/s"],
						],
						"Tuning",
					),
					p("Steady-state upstream load is roughly hot keys divided by the freshness window. With the 60 s window, 769 hot Pending transfers need about 13 refreshes per second, which has to stay under the provider quotas."),
				],
			},
			{
				id: "token-metadata",
				title: "Token metadata",
				blocks: [
					p("Symbol and decimals come from one Helius `getAsset` per mint, cached per mint (24 h resolved, 60 s failed or empty). A cache miss uses the shared Helius limiter only if a token is free. Otherwise the transfer is processed without metadata and the miss is not cached, so a later request retries."),
				],
			},
		],
	},

	{
		slug: "reliability",
		group,
		title: "Reliability",
		description:
			"Delivery and failure handling in Hermit: at-least-once with idempotent writes, dead-letter queue, recovery, re-enrichment, reconcile poll and ingestion keepalive.",
		intro: [
			p("Failures are classified as permanent or transient. Permanent ones are dead-lettered with a reason; transient ones stay pending and are redelivered within a bounded budget."),
		],
		subs: [
			{
				id: "delivery",
				title: "At-least-once, exactly-once persistence",
				blocks: [
					p("Redis Streams guarantees at-least-once delivery. Postgres upserts on `hash` and `(protocol, message_key)` absorb redelivery, so a crash mid-batch can never double-write, for every protocol."),
				],
			},
			{
				id: "dead-letter",
				title: "Dead-letter queue",
				blocks: [
					p("A transaction that fails analysis or persistence and cannot fix itself (malformed data, a normalisation failure, a provider answer that cannot change on retry) moves to `bridge:transactions:failed`. It never blocks the stream and is never silently dropped."),
				],
			},
			{
				id: "transient-failures",
				title: "Transient failures",
				blocks: [
					p("A rate limit, timeout, 5xx, limiter shed (`Overloaded`) or database outage neither acks nor dead-letters. The message stays pending and recovery redelivers it after its idle time."),
					p("Every delivery is counted. Past `WORKER_MAX_DELIVERIES` (default 10) the message is dead-lettered with the reason recorded, so nothing is retried forever."),
				],
			},
			{
				id: "recovery",
				title: "Self-healing recovery",
				blocks: [
					p("A dedicated worker reclaims messages abandoned by a crashed consumer via `XAUTOCLAIM`, sweeping every 30 s for messages idle longer than 5 minutes. It runs the same handler as first delivery, so it classifies failures the same way."),
				],
			},
			{
				id: "helius-wait",
				title: "Helius token wait",
				blocks: [
					p("The API sheds a request after 2 s without a token. Live workers wait up to `HELIUS_LIVE_TOKEN_WAIT_MS` (20 s) for the first token of a message."),
					p("That wait must stay well below the reclaim idle time (5 min), or a message could be reclaimed while it is still waiting."),
				],
			},
			{
				id: "preload",
				title: "Account preloads",
				blocks: [
					p("A live message whose account preload fails transiently is left pending and retried. A redeem without its VAA account would otherwise fall onto the WormholeScan path and could store a row with the wrong source wallet. A permanent preload error stays best effort and is logged."),
				],
			},
			{
				id: "re-enrichment",
				title: "Open transfers converge",
				blocks: [
					p("A supervised worker re-enriches `Detected` and `Pending` rows every `REENRICH_INTERVAL_SECS` (30 s), oldest attempt first, through the WormholeScan limiter. It never touches Helius."),
					ul(
						"Rows younger than `REENRICH_MIN_AGE_SECS` are left to the normal pipeline. A row is not asked again within `REENRICH_RETRY_SECS`. Rows older than `REENRICH_MAX_AGE_SECS` (7 days) are given up on.",
						"The same pass backfills the origin tx of `Completed` inbound rows. `REENRICH_ORIGIN_SHARE` (40% by default) reserves that share of each batch so a backlog of open rows cannot starve it.",
						"Every backfill attempt is recorded in `last_enrich_attempt_at`, and the queue orders by it NULLS FIRST so it rotates instead of re-selecting the same rows.",
						"A pass ends early after three provider outages in a row.",
					),
				],
			},
			{
				id: "reconcile-poll",
				title: "Reconciliation poll",
				blocks: [
					p("The WebSocket is the low-latency path. The poll is the safety net. Every `INGEST_POLL_SECS` (default 300), per registered program, it scans `getSignaturesForAddress`, subtracts what `bridge_transfers` already holds, and republishes the rest through the normal stream."),
					ul(
						"Window: from `last_poll_end - INGEST_POLL_OVERLAP_SECS` to `now - INGEST_POLL_OFFSET_SECS`.",
						"The per-program checkpoint lives in `indexer_state` and only moves forward.",
						"A cycle publishes at most `INGEST_POLL_MAX_PUBLISH` (500). A capped cycle does not advance the checkpoint, so the remainder is covered again.",
						"It uses its own Helius reconcile lane so it cannot starve ingestion.",
					),
				],
			},
			{
				id: "ingestion",
				title: "Ingestion resilience",
				blocks: [
					ul(
						"Always on under a supervisor, whether or not anyone is connected to `/stream`.",
						"On every reconnect a backfill starts `INGEST_REWIND_SLOTS` (20) slots before the checkpoint and runs concurrently with the read loop.",
						"A checkpoint gate keeps live notifications from advancing the persisted checkpoint until the backfill finishes.",
						"A WebSocket ping every 30 s and a no-frame watchdog at 90 s force a reconnect on a silently dead socket.",
						"The checkpoint upsert uses `GREATEST`, so it never moves backwards.",
						"A Redis `SET NX EX` dedupe publishes a signature seen by both the backfill and the live feed once.",
					),
				],
			},
			{
				id: "shutdown",
				title: "Graceful shutdown",
				blocks: [
					p("SIGTERM or Ctrl+C stops new work being picked up, lets in-flight messages finish and drains open HTTP and WebSocket connections before exit."),
				],
			},
		],
	},
];