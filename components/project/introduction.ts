import type { Section } from "./types";
import { p, table, ul } from "./blocks";

const group = "Introduction";

export const introduction: Section[] = [
	{
		slug: "overview",
		group,
		title: "Overview",
		description:
			"Hermit is a real-time Solana bridge transaction indexer. It decodes bridge transfers from on-chain data and streams them live over WebSocket.",
		intro: [
			p("Hermit is a real-time indexer for bridge transactions on Solana. It decodes bridge activity straight from Solana data, in both directions (sends out of Solana, redeems and solver fills into it), across the major bridge protocols on Solana."),
			p("Each transfer is persisted from on-chain data alone, enriched afterwards with its counterpart leg and final status from protocol APIs, and streamed live to clients over WebSocket."),
		],
		subs: [
			{
				id: "what-it-does",
				title: "What it does",
				blocks: [
					ul(
						"Detects bridge transfers from Solana data (Helius), never from an explorer.",
						"Persists each transfer as `Detected` before any enrichment exists.",
						"Enriches with destination tx and final status from protocol APIs such as WormholeScan.",
						"Streams every analysed transaction live over WebSocket, from the same step that writes Postgres.",
						"Serves analysis and list endpoints from a layered cache with upstream rate limiting.",
					),
				],
			},
			{
				id: "where-it-is-today",
				title: "Where it is today",
				blocks: [
					p("The product is moving from a Wormhole transfer indexer to a protocol-agnostic core with one adapter per bridge protocol."),
					p("Wormhole (Portal, Portal NFT and NTT), Circle CCTP, deBridge and Mayan are decoded. Sends out of Solana are stored chain-first and WormholeScan only enriches Wormhole transfers. Redeems into Solana are decoded from the posted VAA account and stored as `Inbound` rows."),
				],
			},
			{
				id: "stack",
				title: "Stack",
				blocks: [
					table(
						["Component", "Used for"],
						[
							["Rust, axum", "HTTP API, WebSocket, workers"],
							["Postgres 18", "Durable transfers, chain registry, indexer state"],
							["Redis Streams", "Ingest queue, consumer groups, dead-letter stream, live feed ring"],
							["Helius", "Solana RPC and WebSocket (`logsSubscribe`, `getTransaction`, `getMultipleAccounts`, `getAsset`)"],
							["WormholeScan", "Enrichment only: VAA, destination tx, origin tx"],
						],
						"Stack",
					),
				],
			},
		],
	},

	{
		slug: "status",
		group,
		title: "Status and coverage",
		description:
			"Current implementation state of Hermit by area, and which bridge protocols are indexed today versus planned.",
		intro: [p("A snapshot of what is built, what is wired into the pipeline, and what is still ahead.")],
		subs: [
			{
				id: "current-state",
				title: "Current state",
				blocks: [
					table(
						["Area", "State"],
						[
							["Wormhole Token Bridge", "Outbound indexed chain-first: `Detected` from Solana data alone, WormholeScan enriches. Inbound redeems decoded from the posted VAA account and stored as `Completed`."],
							["Detection", "Chain-first for Wormhole outbound. Transactions that decode to no transfer still go through the WormholeScan-gated path."],
							["Domain model and schema", "Generalised: `bridge_transfers` identified by `(protocol, message_key)` with `direction`, `via`, raw chain references and `NUMERIC(78,0)` amounts. Wormhole fields live in `wormhole_messages`."],
							["Chains", "DB-backed registry loaded at startup and refreshed in the background. A chain added to the database works without a deploy."],
							["Protocol core", "`BridgeAdapter`, `ProtocolRegistry`, `compose` and adapters for Wormhole (Portal, Portal NFT, NTT), CCTP, deBridge and Mayan are wired into `analyse_tx`."],
							["Read path", "`/analyse` working, cache-hit throughput measured."],
							["Destination tx resolution", "Read from the `/operations` payload, then `/global-tx` when the VAA matched but no destination tx is present. `Pending` means WormholeScan itself has no destination tx."],
							["Enrichment", "Provider behind the `EnrichmentProvider` trait plus a supervised background pass that re-enriches open rows and fills missing origin txs."],
							["WebSocket ingestion", "Always on under a supervisor. Reconnect rewind, keepalive watchdog and a periodic reconciliation poll are in place; 24 h reconcile recall is 100%."],
							["CI", "`cargo fmt --check`, `clippy -D warnings` and `cargo test` on every PR and on `main`."],
							["Deploy", "Two systemd units (api and stream roles) on the main EC2 box over shared Postgres and Redis. CI/CD automation is still open."],
						],
						"Current state by area",
					),
				],
			},
			{
				id: "protocol-coverage",
				title: "Protocol coverage",
				blocks: [
					table(
						["Protocol", "State"],
						[
							["Wormhole Token Bridge (Portal)", "Sends indexed chain-first, WormholeScan only enriches. Redeems into Solana decoded and stored."],
							["Wormhole Portal NFT and NTT", "Indexed; the protocol name distinguishes them in analysis and the live feed."],
							["Circle CCTP, deBridge, Mayan", "Indexed, including their protocol-specific message identities in the v2 API."],
							["LayerZero/Stargate, Allbridge, Hyperlane, Chainlink CCIP, Across", "Candidates. Inclusion and order come from DefiLlama bridge volume for Solana at the start of each phase. Program IDs and layouts are verified against official docs or source before an adapter is written."],
						],
						"Protocol coverage",
					),
				],
			},
		],
	},

	{
		slug: "principles",
		group,
		title: "Principles",
		description:
			"The five design rules behind Hermit: chain-first detection, protocol adapters, real composition, direction, and graceful handling of unknown chains.",
		intro: [p("These rules decide how detection, storage and enrichment fit together.")],
		subs: [
			{
				id: "chain-is-the-source-of-truth",
				title: "The chain is the source of truth",
				blocks: [
					p("Detection and decoding come from Solana data (Helius), never from an explorer. WormholeScan and any other protocol API are enrichment only (destination tx, final status)."),
					p("A transaction is persisted as `Detected` from on-chain data alone, even when no enrichment exists yet. Enrichment is cross-checked: a WormholeScan VAA is applied only when its emitter chain, emitter address and sequence match the message decoded on chain, otherwise it is ignored."),
				],
			},
			{
				id: "protocol-agnostic-core",
				title: "Protocol-agnostic core, per-protocol adapters",
				blocks: [
					p("Each adapter declares its program IDs, classifies and decodes a Solana transaction into a bridge event (or rejects it), and optionally resolves the counterpart."),
					p("Rejection matters: many transactions that touch a bridge program are admin or attest calls, not transfers."),
				],
			},
			{
				id: "composition",
				title: "Composition is real",
				blocks: [
					p("Mayan runs on Wormhole and CCTP, and aggregators route through other bridges. One transfer can carry an outer protocol and an underlying rail."),
					p("The underlying transfer is indexed once, the router is recorded as an attribute (`via`), and nothing is double-counted."),
				],
			},
			{
				id: "direction",
				title: "Direction matters",
				blocks: [
					p("Solana-outbound sends and Solana-inbound redeems or fills (including solver fills for intent bridges) are both indexed."),
				],
			},
			{
				id: "unknown-is-not-an-error",
				title: "Unknown is not an error",
				blocks: [
					p("An unrecognised chain ID never crashes the pipeline or drops a transfer. It is stored as `unresolved(protocol, id)`."),
				],
			},
		],
	},
];