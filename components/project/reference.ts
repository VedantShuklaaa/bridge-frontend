import type { Section } from "./types";
import { code, note, p, table, ul } from "./blocks";

const group = "Reference";

export const reference: Section[] = [
	{
		slug: "api",
		group,
		title: "API reference",
		description:
			"Hermit's HTTP and WebSocket API: analyse endpoints (v1, v2), the paginated transfers list, the live feed ring, error codes and CORS.",
		intro: [
			p("`chain` is the source chain. Solana is currently the only supported source chain; anything else returns `422 NORMALISATION_FAILED`."),
		],
		subs: [
			{
				id: "endpoints",
				title: "Endpoints",
				blocks: [
					code(
						`GET /api/v1/transactions/analyse?transaction_hash=<hash>&chain=solana
GET /api/v2/transactions/analyse?transaction_hash=<hash>&chain=solana
GET /api/v2/transfers
GET /api/v2/transfers/live
WS  /api/v1/transactions/stream`,
						"endpoints",
					),
					p("`/api/v2` serves the generalised model: protocol, direction, via, chain references and all transfers of a tx. `/api/v1` keeps its Wormhole-shaped response through a compatibility mapper until it is retired."),
				],
			},
			{
				id: "errors",
				title: "Errors",
				blocks: [
					table(
						["Status", "Code", "Meaning"],
						[
							["200", "", "Analysis returned (from cache, Postgres, or a fresh fetch)."],
							["400", "`INVALID_TX_HASH`, `BAD_REQUEST`", "Malformed hash or request."],
							["404", "`TX_NOT_FOUND`, `VAA_NOT_AVAILABLE`", "Transaction does not exist, or its VAA is not available yet. Cached briefly."],
							["422", "`NORMALISATION_FAILED`", "Transaction data could not be normalised, including unsupported chains."],
							["429", "`UPSTREAM_RATE_LIMITED`", "A provider rate-limited the request after retries. Sends `Retry-After: 1`."],
							["502 / 504", "`UPSTREAM_ERROR`, `UPSTREAM_TIMEOUT`", "A provider failed or timed out after retries."],
							["503", "`OVERLOADED`", "The service is shedding load (limiter or permit wait exceeded 2 s). Sends `Retry-After: 1`."],
							["500", "`INTERNAL_ERROR`", "Unexpected error."],
						],
						"Error codes",
					),
				],
			},
			{
				id: "list-transfers",
				title: "List transfers",
				blocks: [
					p("`GET /api/v2/transfers` lists stored transfers newest first, one page per request. `items` uses the same transfer object as `/api/v2/transactions/analyse`. There is deliberately no total count, since it needs a full scan of the filtered set. Page until `next_cursor` is `null`."),
					code("GET /api/v2/transfers?limit=50&direction=Inbound&status=Completed&chain=ethereum", "example"),
					table(
						["Parameter", "Meaning", "Rules"],
						[
							["`limit`", "Page size", "Default 50, 1 to 200"],
							["`cursor`", "Position from the previous `next_cursor`", "Opaque; strictly after the last returned row"],
							["`protocol`", "Exact stored protocol", "Non-empty"],
							["`direction`", "`Outbound` or `Inbound`", "Case-sensitive"],
							["`status`", "`Detected`, `Pending`, `Completed`, `Failed`, `Refunded`", ""],
							["`chain`", "Canonical chain slug from `chains.slug`", "Matches source or destination"],
							["`token`", "Exact stored token address", "No token-chain key"],
							["`from`", "Inclusive lower bound on `created_at`", "RFC3339"],
							["`to`", "Exclusive upper bound on `created_at`", "RFC3339; must be after `from`"],
						],
						"List parameters",
					),
					p("Pagination is keyset over `(created_at DESC, id DESC)`. There is no `OFFSET`, and rows with identical `created_at` are still visited exactly once. The ordering key is the time the indexer stored the row, not the chain's block time, so a backfilled transfer appears where it was inserted. There is no cache on this path; every request reads Postgres."),
					note("A 400 `BAD_REQUEST` covers an invalid `limit`, cursor or timestamp, an unknown chain, direction or status, and `from >= to`. Each item carries its protocol's own `message_id` shape (Wormhole, CCTP, deBridge, Mayan), and the frontend tolerates a new variant instead of failing the page."),
				],
			},
			{
				id: "live-feed",
				title: "Live feed",
				blocks: [
					p("`GET /api/v2/transfers/live` is a server-owned ring of the most recent WebSocket frames, so every browser sees the same recent transactions instead of each tab keeping its own list. It reads Redis only."),
					code("GET /api/v2/transfers/live?limit=15&before=<next_cursor>", "example"),
					table(
						["Parameter", "Meaning", "Rules"],
						[
							["`limit`", "Page size", "Default 15, clamped to 1..100"],
							["`before`", "Position from the previous `next_cursor`", "Opaque; strictly older than the last returned item"],
						],
						"Live feed parameters",
					),
					code(`{ "items": [...], "next_cursor": string|null, "total": <ZCARD>, "server_time": <ms> }`, "response"),
					ul(
						"Each item is the v1 WebSocket frame plus `first_seen_at` and `updated_at` (milliseconds). `first_seen_at` never changes when an enrichment update replaces the frame; `updated_at` is the last write.",
						"Items are newest first. `total` is the current ring size, not a filtered count.",
						"If the ring is empty after a cold start, one process takes `SET bridge:live:warmup 1 NX EX 30` and fills it from the newest stored analyses. Concurrent readers get an empty page until that finishes.",
						"When Redis is down the endpoint serves the last in-process page for up to 10 seconds, then `503` with an empty-feed body. A circuit breaker admits one Redis probe per 5-second window.",
						"Responses carry `Cache-Control: public, s-maxage=2, stale-while-revalidate=10`.",
						"The route exists only when `LIVE_FEED_REDIS_ENABLED` is on. When off it returns 404 and the WebSocket payload is unchanged.",
					),
				],
			},
			{
				id: "cors",
				title: "CORS",
				blocks: [p("CORS is origin-allowlisted via `ALLOWED_ORIGINS`. Nothing is permitted by default.")],
			},
		],
	},

	{
		slug: "observability",
		group,
		title: "Metrics and health",
		description:
			"Hermit's Prometheus metrics and the /health endpoint: metric names, labels, and how health is cached and reported.",
		intro: [
			p("Every role serves Prometheus metrics at `/metrics` on `0.0.0.0:$METRICS_PORT` (default `9100`). The endpoint is internal: the reverse proxy does not expose it, and the security group must keep `9100` closed."),
		],
		subs: [
			{
				id: "prometheus",
				title: "Prometheus metrics",
				blocks: [
					table(
						["Metric", "Type", "Labels"],
						[
							["`cache_lookups_total`", "counter", "`result`: `memory`, `pg_fresh`, `pg_stale`, `cold`"],
							["`cache_refresh_skipped_total`", "counter", "`reason`: `no_token`, `in_flight`"],
							["`limiter_wait_seconds`", "histogram", "`provider`: `helius`, `wormhole`; `lane`: `api`, `ingest`, `reconcile`, `shared`"],
							["`upstream_calls_total`", "counter", "`provider`, `lane`; `outcome`: `ok`, `err`, `timeout`"],
							["`http_request_duration_seconds`", "histogram", "`route`: matched route pattern or `unmatched`; `status_class`: `2xx`, `4xx`, `5xx`, `other`"],
							["`stream_lag`", "gauge", "none"],
							["`stream_pending`", "gauge", "none"],
							["`dead_letter_depth`", "gauge", "none"],
							["`ingest_age_seconds`", "gauge", "none"],
							["`ingest_reconnects_total`", "counter", "`reason`: `watchdog`, `subscribe_failed`, `closed`, `error`"],
							["`ingest_backfill_inflight`", "gauge", "none"],
							["`ingest_backfill_duration_seconds`", "histogram", "none"],
							["`ingest_backfill_published_total`", "counter", "none"],
							["`poll_cycles_total`", "counter", "`program`; `result`: `ok`, `error`"],
							["`poll_missed_total`", "counter", "`program`"],
							["`poll_last_success_timestamp_seconds`", "gauge", "`program`"],
						],
						"Prometheus metrics",
					),
				],
			},
			{
				id: "metric-notes",
				title: "Notes on the metrics",
				blocks: [
					ul(
						"Every label is a static string. No transaction hashes, addresses or user ids are used as label values, and `program` is one of the registered program IDs.",
						"`cache_lookups_total` counts cache lookups, so a v2 request that misses its own cache also performs the underlying v1 lookups.",
						"`limiter_wait_seconds` includes shed waits, and `upstream_calls_total` counts each attempt, retries included.",
						"A WormholeScan call is reported with lane `shared` because one limiter serves every role.",
						"The four health gauges are set only when `/health` is served, from its 15 s cache. A value the probe could not measure keeps its previous reading instead of dropping to zero.",
					),
				],
			},
			{
				id: "health",
				title: "Health endpoint",
				blocks: [
					p("`GET /health` reports `status` (`ok` or `degraded`), `postgres_ok`, `redis_ok`, `ingest_age_secs`, `stream_lag`, `stream_pending` and `dead_letter_len`. It never calls Helius or WormholeScan."),
					ul(
						"200 normally. 503 only when Postgres or Redis is down, or `ingest_age_secs` is greater than `HEALTH_MAX_INGEST_AGE_SECS` (default 3600, deliberately generous because quiet 25-minute gaps have happened in production).",
						"A missing heartbeat (fresh database, or ingestion never started) is `degraded` with 200.",
						"The answer is cached in memory for 15 s and concurrent polls share one measurement, since Upstash bills per command.",
					),
				],
			},
			{
				id: "scrape-config",
				title: "Scrape config",
				blocks: [
					code(
						`scrape_configs:
  - job_name: hermit
    static_configs:
      - targets: ["127.0.0.1:9100"]   # the host that runs the process`,
						"prometheus.yml",
					),
				],
			},
		],
	},

	{
		slug: "testing",
		group,
		title: "Testing",
		description:
			"What Hermit's test suites cover: pure decoders, golden fixtures, persistence idempotency, schema migrations, chain registry, list paging and re-enrichment.",
		intro: [
			p("Pure logic is tested without network. Provider data is tested against real captured fixtures. Database behaviour is tested on Postgres 18."),
		],
		subs: [
			{
				id: "running-tests",
				title: "Running tests",
				blocks: [
					code("cargo test", "shell"),
					p("Suites marked DB need Postgres 18. Set `TEST_DATABASE_URL` to point them at a server you run. Capture new fixtures with `scripts/capture_fixtures.sh`."),
				],
			},
			{
				id: "suites",
				title: "Suites",
				blocks: [
					table(
						["Suite", "Covers"],
						[
							["`decode_unit`", "VAA decoding (hand-built and malformed), address decoding, amount formatting. No network."],
							["`fixtures_decode`", "Pure decoders over real captured provider responses in `tests/fixtures/`."],
							["`golden_fixtures`", "Protocol registry over fixture pairs, compared with WormholeScan's decoding. Inbound redeems decode from captured posted VAA accounts; without the account they are asserted `Unsupported`."],
							["`persistence_idempotency` (DB)", "Redelivering the same transaction never produces a duplicate row in `transactions`, `bridge_transfers` or `wormhole_messages`."],
							["`bridge_transfers_schema` (DB)", "A2 schema and migration of staged legacy rows, inbound storage and repair migrations, due-rows queries and queue rotation, SQL `resolve_chain` agreeing with the Rust registry."],
							["`chain_registry_db` (DB)", "Seeding, resolution, `pending_review` rules, rejection of unknown status values, a failed refresh keeping the previous snapshot."],
							["`list_transfers` (DB)", "Keyset paging visits every row once, every filter and combination, `from` inclusive and `to` exclusive, limit and cursor errors, empty database."],
							["`reenrich_backfill`", "Re-enrichment against the fake upstream: an open backlog still leaves a share of each batch to the origin backfill."],
							["Unit tests in `src/`", "Ingestion backfill and checkpoint gate, protocol routing and compose, the Wormhole adapter (outbound, with-payload, redeems, malformed), the posted VAA parser, correlator, detect, enrichment, and the Helius and WormholeScan clients."],
						],
						"Test suites",
					),
					note("The Redis dedupe has no automated test yet."),
				],
			},
		],
	},
];