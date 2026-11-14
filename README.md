# bridge-frontend

The web UI for [bridgeIndexer](https://github.com/VedantShuklaaa/bridgeIndexer), a
Rust indexer for bridge transfers on Solana. Search a transaction, inspect every
bridge transfer it contains, and watch transfers as they are indexed.

The app is served under the `/hermit` base path (`/hermit/txs`, not `/txs`).

## Stack

- Next.js (App Router) + TypeScript (strict)
- Bun for runtime and package management
- Tailwind CSS v4, Framer Motion, `next-themes`, Zod

## Commands

```bash
bun install
bun dev
bun run build
bun run lint
bunx tsc --noEmit
```

Never use npm, yarn or pnpm in this repository.

## Environment

Copy `env.example` to `.env.local` and fill it in. `NEXT_PUBLIC_*` values are
inlined at build time, so redeploy after changing any of them.

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | public | Canonical origin for metadata and JSON-LD. |
| `API_BASE_URL` | server-only | Indexer origin reached by `app/api/*` route handlers. Never shipped to the browser. |
| `API_TIMEOUT_MS` | server-only | Timeout for proxied indexer requests, in milliseconds. |

The browser only calls this app's own `/api/*` route handlers, so the CSP
`connect-src` in `proxy.ts` is `'self'` outside development.

## Routes

- `/` — project landing page.
- `/txs` — transaction search plus the live feed of bridge transfers, newest
  first.
  - Search a Solana signature to open its detail page.
  - 15 rows per page; the page lives in the URL as `?page=N`, so browser back
    and forward keep the position.
  - The table is fed by `GET /api/v2/transfers` through our `/api/transfers`
    proxy. The newest page is polled every five seconds; polling pauses while
    the tab is hidden.
  - Older pages are fetched with the backend's opaque `next_cursor`, so the
    feed keeps cursor pagination instead of an offset.
  - Up to 500 entries are kept, de-duplicated by `observed_tx_hash` and
    `event_index`. A repeat for the same transfer replaces the row in place, so
    an enrichment update (for example `Pending` → `Completed`) is reflected.
  - The Protocol column shows the backend's `protocol_name` (`Portal`,
    `Portal NFT`, `NTT`, `CCTP`, `deBridge`, `Mayan`), with a fallback that
    rebuilds it from `protocol` and `program` for older responses.
  - The collapsed row shows transaction hash, amount, route, protocol and
    status. The Time column uses `first_seen_at` or `updated_at` when the list
    item carries one; otherwise it shows `—` rather than a made-up value.
- `/txs/[hash]` — per-transaction dashboard with overview, route, source,
  destination, token and amount, protocol message and raw payload sections.
  It reads `GET /api/analyse` (our proxy), so direct links and hard refreshes
  always render the full v2 response.
- `/docs` — documentation.
