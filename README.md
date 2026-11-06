# bridge-frontend

The web UI for [bridgeIndexer](https://github.com/VedantShuklaaa/bridgeIndexer), a
Rust indexer for bridge transfers on Solana. Search a transaction, inspect every
bridge transfer it contains, and watch transfers as they are indexed.

The app is served under the `/hermit` base path (`/hermit/live`, not `/live`).

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
| `NEXT_PUBLIC_HERMIT_WS_URL` | public | Live feed WebSocket (`/api/v1/transactions/stream`). Must be `wss:` in production. |
| `NEXT_PUBLIC_HERMIT_API_URL` | public | Indexer origin used by the transaction detail route for direct links and hard refreshes. Must be `https:` in production. |
| `API_BASE_URL` | server-only | Indexer origin reached by `app/api/*` route handlers. Never shipped to the browser. |
| `API_TIMEOUT_MS` | server-only | Timeout for proxied indexer requests, in milliseconds. |

The public origins are also added to the CSP `connect-src` in `proxy.ts`.

## Routes

- `/` — search a Solana transaction.
- `/tx/[hash]` — full analysis for a searched Solana transaction.
- `/live` — live feed of bridge transfers, newest first.
  - 15 rows per page; the page lives in the URL as `?page=N`, so browser back
    and forward keep the position. Out-of-range pages clamp to the last page.
  - The WebSocket and the entry store live in `LiveProvider`, mounted in the
    root layout. Opening `/live` starts the stream; navigating away keeps it
    connected for the rest of the session.
  - Up to 500 entries are kept, de-duplicated by transaction hash. A repeat for
    the same hash replaces the frame (for example `Pending` → `Completed`) while
    keeping the original `receivedAt`, so the elapsed timer does not reset.
  - The store is mirrored to `sessionStorage` and rehydrated on reload.
  - Reconnects with capped exponential backoff (1s → 15s) plus jitter.
- `/live/[hash]` — per-transaction dashboard with overview, route, source,
  destination, token and amount, Wormhole message, bridge event and raw payload
  sections. It reads the live store first and falls back to
  `GET {NEXT_PUBLIC_HERMIT_API_URL}/api/v2/transactions/analyse` for direct links
  and hard refreshes.
