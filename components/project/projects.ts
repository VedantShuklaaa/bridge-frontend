import type { Section } from "./types";
import { checks, code, ol, p, table, ul } from "./blocks";

const group = "Project";

export const project: Section[] = [
	{
		slug: "roadmap",
		group,
		title: "Roadmap",
		description:
			"Hermit's roadmap by phase with completion state: protocol-agnostic core, deploy pipeline, API scaling, WebSocket stream, and what is out of scope.",
		intro: [
			p("Work is organised in phases. Each checkpoint ships on its own branch, with tests, a benchmark row and a tag."),
		],
		subs: [
			{
				id: "workflow",
				title: "Workflow",
				blocks: [
					ol(
						"Branch with a prefix: `feat/` for features and adapters, `fix/` for correctness, `perf/` for speed, `ci/` or `chore/` for infra, `docs/` for docs only. One change per branch.",
						"Write tests first or alongside. Use fixtures for anything that parses provider data.",
						"Run the benchmark for that phase, on the same workload as the previous tag.",
						"Add a row to the benchmark results: version, change, before, after.",
						"Open a PR, get CI green, merge, tag (`v0`, `v1`, ...) and deploy.",
						"Re-run the benchmark on EC2. Published numbers are EC2 numbers; laptop numbers are for iteration only.",
					),
					p("Rule for the numbers: two runs, warm and cold kept separate, read the status code distribution (a 4xx or 5xx still counts as success in most load tools), and record the git SHA and instance type next to every row."),
				],
			},
			{
				id: "phase-0",
				title: "Phase 0: foundation",
				blocks: [
					checks(
						[true, "GitHub Actions CI: `cargo fmt --check`, `clippy -D warnings`, `cargo test`"],
						[true, "Unit tests for VAA decode, address decode and amount formatting"],
						[true, "Fixture capture script and fixture-driven decode tests"],
						[true, "`.env.example` and README drift fixed"],
						[false, "Tag `v0` with the baseline numbers"],
					),
					p("Exit: CI green on `main`."),
				],
			},
			{
				id: "phase-1",
				title: "Phase 1: protocol-agnostic core",
				blocks: [
					p("The product is a Solana bridge transaction indexer, but the code started as a Wormhole transfer indexer. The domain model, schema, chain handling and detection were Wormhole-shaped, and detection was gated on WormholeScan."),
					p("A second bug made every transfer report `Pending`: the destination tx was read from a field the `/operations` response does not carry. It is fixed, and the lookup now lives in `enrichment/`."),
					p("Delivery is one protocol per phase. Phase A builds the core with Wormhole as the only real adapter."),
				],
			},
			{
				id: "phase-a",
				title: "Phase A: core with Wormhole only",
				blocks: [
					checks(
						[true, "A1. Adapter trait and registry: pure decode, Token Bridge outbound, and A1b inbound redeems through preloaded accounts"],
						[true, "A2. Generalised domain model and schema, existing rows migrated in place and tested on staged legacy data"],
						[true, "A3. DB-backed chain registry replacing the `ChainId` enum; unresolved IDs stored, never dropped"],
						[false, "A4. All Wormhole programs on Solana (NTT and others), one `logsSubscribe` per program ID with a checkpoint per program"],
						[true, "A5. Chain-first detection; WormholeScan enriches and never gates persistence (A5b: destination tx fix, provider trait, background re-enrichment)"],
						[false, "A6. Composition end to end: one transfer per message identity with `via`. `compose()` is done; the outer plus underlying test remains"],
						[true, "A7. Direction: Solana-outbound sends and Solana-inbound redeems both indexed"],
						[true, "A8. Always-on ingestion with a bounded Helius budget"],
						[true, "A9. Fixtures captured from real txs and golden tests per adapter"],
						[true, "A10. `/api/v2` serves the generalised model; `/api/v1` is pinned byte for byte through a compatibility mapper"],
					),
					p("Exit: Wormhole transfers are persisted as `Detected` with WormholeScan fully unavailable, every non-transfer fixture is rejected with a reason, and the migration is tested on staged existing rows."),
				],
			},
			{
				id: "phase-1-remaining",
				title: "Remaining Phase 1 items",
				blocks: [
					checks(
						[true, "1a. Split `analyse_tx` into fetch (IO), decode (pure) and enrich (IO)"],
						[true, "1b. Destination tx resolution: operation payload paths first, then `global-tx`"],
						[true, "1c. Provider lanes: `Lane::Api` and `Lane::Ingest`, each with its own Helius URL, limiter and token patience"],
						[true, "1d. Golden tests per fixture and the on-chain-first status matrix"],
						[true, "1e. `replay` bin comparing our status with WormholeScan `global-tx`"],
						[false, "1f. Criterion bench for the pure classify and decode path"],
					),
					p("Exit: at least 99% agreement on transfers older than 15 minutes, and `Pending` only when WormholeScan itself has no destination tx."),
				],
			},
			{
				id: "later-protocols",
				title: "Phase B and later: one protocol per phase",
				blocks: [
					p("Each phase adds one protocol, in descending order of Solana bridge volume."),
					ol(
						"Derive the current ranking from DefiLlama bridge data for Solana. Nothing is hardcoded from memory.",
						"Verify the protocol's program IDs and instruction or event layouts against its official docs or source.",
						"Capture fixtures from real transactions and write golden tests, including admin or attest transactions that must be rejected.",
						"Write the adapter, its enrichment provider if the protocol has an API, and its chain-ID mappings for the registry.",
						"Cover composition with any protocol already indexed (Mayan over Wormhole and CCTP, aggregators over everything).",
					),
					p("Candidates: LayerZero/Stargate, Allbridge, Hyperlane, Chainlink CCIP, Across."),
				],
			},
			{
				id: "phase-2",
				title: "Phase 2: deploy pipeline and roles",
				blocks: [
					checks(
						[true, "`ROLE=api|stream|all` with two systemd units over shared Postgres and Redis"],
						[false, "Hostnames `api.<domain>` and `stream.<domain>`, and the second Helius key set on the box"],
						[false, "CI builds the release binary; CD over SSH on merge to `main` with a health check and rollback"],
						[true, "`GET /health`: Postgres and Redis ping, ingest heartbeat age, stream lag and pending, dead-letter depth"],
						[true, "Metrics: request latency histogram, cache hit and miss counters, limiter wait time, stream lag"],
						[true, "Host-installed reverse proxy for TLS, HTTP/2 and compression; port 8080 stays closed"],
						[false, "Hardening: Postgres and Redis on `127.0.0.1` only, no default credentials, security group limited to 80/443 and SSH from a fixed IP"],
						[true, "Load generator on a second instance in the same VPC"],
					),
					p("Exit: merge to `main` deploys both roles, and the API benchmark runs against the deployed service."),
				],
			},
			{
				id: "phase-3",
				title: "Phase 3: scale the API",
				blocks: [
					p("Measure before changing anything. Each item is one tagged experiment with the same workloads."),
					checks(
						[false, "3a. True server ceiling: re-run `R-hit` with a stronger load generator, profile, and explain the 33 to 45 ms latency cluster"],
						[true, "3b. `v1` cache stores pre-serialized response bytes"],
						[true, "perf-1. mimalloc as the global allocator"],
						[true, "perf-2. `AppState` behind one `Arc`"],
						[true, "3c. `v2` pre-serialized response body"],
						[false, "3d. Two API instances behind a proxy: Redis-shared cache versus sticky routing"],
						[true, "3e. Cold path measured against a fake upstream with injected latency and 429s (Helius batching not pursued)"],
						[true, "3f. Write path: consumer throughput against the fake upstream"],
						[true, "3g. List endpoint with keyset pagination, benchmarked on about 1M seeded rows"],
					),
					p("Exit: a documented ceiling for each workload and what limits it (CPU, Postgres, provider quota)."),
				],
			},
			{
				id: "phase-4",
				title: "Phase 4: WebSocket stream",
				blocks: [
					p("Metric: recall and precision. Ground truth is per program: `getSignaturesForAddress` over a time window, run through the adapter's classifier offline and diffed against the database."),
					checks(
						[true, "4a. `reconcile` bin: per-program recall, classification precision and a 24 h baseline"],
						[true, "4b. Rewind the checkpoint on reconnect and dedupe by signature"],
						[true, "4c. Backfill as a separate task, concurrent with live reads, behind a checkpoint gate"],
						[true, "4d. Ping and pong keepalive and a no-message watchdog that forces a reconnect"],
						[true, "4e. Surface subscribe errors, supervise the ingester, `GREATEST` on the checkpoint"],
						[true, "4f. Periodic reconciliation poll as a completeness guarantee"],
						[true, "4g. Evaluated Helius streaming options (Enhanced WebSockets need Developer+, LaserStream gRPC needs Business+, webhooks are limited on Free). Decision: keep `logsSubscribe` with 4f as the safety net"],
					),
					p("Exit: recall of at least 99.9% for every indexed program over 24 h, with classification precision and p99 ingestion lag recorded."),
				],
			},
			{
				id: "out-of-scope",
				title: "Out of scope",
				blocks: [
					p("Ingesting bridge transactions that happen only on other chains. Hermit decodes what happens on Solana. Other chains appear as counterparties through the chain registry and enrichment providers, never as ingestion targets. This replaces the earlier multi-chain ingestion phase (Ethereum, BSC and other EVM listeners)."),
				],
			},
		],
	},

	{
		slug: "benchmarks",
		group,
		title: "Benchmarks",
		description:
			"Hermit's benchmark workloads and measured results: cache-hit throughput across optimisations, write path, list endpoint and stream recall.",
		intro: [
			p("All numbers are EC2 numbers unless stated. Every run records the git SHA and instance type."),
		],
		subs: [
			{
				id: "workloads",
				title: "Workloads",
				blocks: [
					table(
						["ID", "What", "Tool"],
						[
							["`R-hit`", "769 distinct signatures, warm cache, 50 connections, 30 s", "`oha`"],
							["`R-mix`", "90% hot and 10% cold keys against the fake upstream", "`oha`"],
							["`R-cold`", "All-unique signatures against the fake upstream (50 ms latency)", "`oha`"],
							["`R-junk`", "Invalid hashes, must never reach an upstream", "`oha`"],
							["`W-ingest`", "100k candidates added to the stream, fake upstream, persisted tx/s and stream lag", "custom bin"],
							["`S-recall`", "Per-program 24 h reconciliation against `getSignaturesForAddress`", "`reconcile` bin"],
							["`S-precision`", "Share of persisted transfers confirmed by an independent source, plus rejections by reason", "`reconcile` bin"],
							["`D-decode`", "Pure classify and decode path, ns per operation", "`criterion`"],
							["`C-agree`", "Status agreement with WormholeScan over the last N signatures", "`replay` bin"],
							["`L-first`", "`GET /api/v2/transfers?limit=50`, 1M seeded rows", "`bench_list.sh`"],
							["`L-deep`", "The same at about 80% depth with the cursor", "`bench_list.sh`"],
							["`L-filtered`", "`direction=Inbound&status=Completed&chain=ethereum`, limit 50", "`bench_list.sh`"],
						],
						"Benchmark workloads",
					),
				],
			},
			{
				id: "method",
				title: "Method",
				blocks: [
					p("Server: `m7i-flex.large` (2 vCPU). Load generator: `c7i.xlarge` in the same VPC. The original `t3.micro` generator was the first thing to hit 100% CPU. 30 s runs, 50 connections, 769 distinct transactions, 1.2 KiB responses."),
					p("Build a file with one valid Solana signature URL per line, then run it twice. The first run fills the cache; the second is the warm number."),
					code("oha -z 30s -c 50 --urls-from-file urls.txt", "shell"),
				],
			},
			{
				id: "baseline",
				title: "Baseline",
				blocks: [
					table(
						["Workload", "Result"],
						[
							["`R-hit` (`v0`)", "36.5k and 37.1k req/s over two runs, every response a 200"],
							["`R-hit` latency (`v0`)", "About 0.8 ms median, p99 about 33 ms (generator CPU-bound)"],
							["`R-hit` re-baseline (`4ffb783`)", "77,275 and 77,302 req/s, 0.64 ms median, p99 1.05 ms (server CPU-bound)"],
							["Cold burst, 50 requests for one hash", "1 upstream fetch, all 50 served in a 28 ms window"],
							["`R-junk`", "About 55k req/s of cheap 400s, zero upstream calls"],
						],
						"Baseline results",
					),
					ul(
						"Cache-hit throughput in `v0` was a lower bound: the load generator was CPU-bound, so the ceiling was not measured.",
						"Uncached transactions are limited by the providers. At default quotas that is roughly 6 new lookups per second on the free plan; overflow gets a 503 after 2 s.",
						"The `v0` p99 of about 33 ms is not comparable to the re-baseline's 1.05 ms, which used a different generator.",
					),
				],
			},
			{
				id: "api-reads",
				title: "API reads",
				blocks: [
					table(
						["Change", "Before (req/s)", "After (req/s)", "Delta"],
						[
							["3b: `/api/v1` serves a pre-serialized body", "86,115", "132,082", "+53.4%"],
							["perf-1: mimalloc allocator", "130,817", "139,345", "+6.5%"],
							["perf-2: `AppState` behind one `Arc`", "142,095", "156,819", "+10.4%"],
							["3c: `/api/v2` serves a pre-serialized body", "86,660", "128,872", "+48.7%"],
						],
						"API read improvements at 50 connections",
					),
					p("All figures are `R-hit` at 50 connections on the same hardware, server CPU-bound, 100% 2xx. Median latency at 50 connections went from 0.58 ms to 0.38 ms after 3b, and p99 ended at about 0.50 ms after perf-2."),
					p("These cover `R-hit` only. Nothing is known from them about the cold path or writes, and the 3c, perf-1 and perf-2 comparisons are single-session runs."),
				],
			},
			{
				id: "write-path",
				title: "Write path",
				blocks: [
					p("3f: 5000 pre-filled signatures, five workers, production defaults, fake upstream at zero latency. With the Helius lane raised to 100000 tokens/s the write path sustains about 0.9k messages/s on EC2 (RDS, local Redis; 2.35k on the laptop) with 5000/5000 rows and no dead letters. With the real 4/s quota it is quota-bound at 2.3 to 2.4 messages/s."),
					p("A larger `XREADGROUP COUNT`, bounded per-worker concurrency, batched upserts and a bigger pool were flat or worse, so no behavioural change was kept. The isolated ceiling is Postgres work per message."),
					p("3e-2: live workers now wait up to 20 s for a Helius token. Before, 197 `service overloaded` dead-letter entries appeared and grew to 237 during redrive. After deployment no new entries or overload log lines were seen, and the 7 remaining entries were redriven to zero. Only a few messages arrived after deployment, so this shows normal-load behaviour, not proof for a large burst."),
				],
			},
			{
				id: "list-endpoint",
				title: "List endpoint",
				blocks: [
					p("3g: `GET /api/v2/transfers`, keyset pagination, one added index, no cache. Exit criteria for every workload: 300 req/s and p99 under 150 ms on EC2, counting 2xx only. `m7i-flex.large`, 50 connections, 30 s per run, about 7,050 rows."),
					table(
						["Workload", "Run", "req/s", "p99 (ms)", "Result"],
						[
							["`L-first`", "1", "1,574", "66", "met"],
							["`L-first`", "2", "1,571", "66", "met"],
							["`L-deep`", "1", "1,463", "90", "met"],
							["`L-deep`", "2", "1,508", "74", "met"],
							["`L-filtered`", "1", "1,272", "85", "met"],
							["`L-filtered`", "2", "1,295", "80", "met"],
						],
						"List endpoint results",
					),
					p("All six runs returned only 2xx responses. Run 1 is a first run, not a restart-cold run."),
				],
			},
			{
				id: "stream-recall",
				title: "Stream recall",
				blocks: [
					table(
						["Window", "Build", "Recall", "Precision", "Missed", "p99 lag"],
						[
							["2026-10-29 to 10-30 (23 h)", "`ee1a2a6`", "100% (1101/1101)", "50/50", "0", "5092 s"],
							["2026-11-05 to 11-06 (24 h)", "4b + 4d", "100% (594/594)", "20/20", "0", "3 s"],
							["2026-11-06 to 11-07 (24 h)", "`ee61d91`", "100% (389/389)", "20/20", "0", "2 s"],
						],
						"Stream recall results, Token Bridge",
					),
					ul(
						"The first window's p99 comes from a planned 91-minute service stop that the restart backfill recovered, which is why nothing counts as missed. Every other hour was fully live, with rows stored under 60 s after block time.",
						"In the last window the poll ran 293 cycles with 0 errors and `poll_missed_total` stayed 0, so the stream was complete without the poll.",
					),
				],
			},
		],
	},
];