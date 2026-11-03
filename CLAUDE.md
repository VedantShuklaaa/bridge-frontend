@AGENTS.md

# bridge-frontend

Frontend for **bridgeIndexer**, a Rust indexer for bridge transfers on Solana
(Wormhole Token Bridge today, more protocols later). The UI lets people search a
transaction, view its transfers in a full-page details view, and watch a live feed.

Backend repo: github.com/VedantShuklaaa/bridgeIndexer. The backend is the source
of truth for response shapes. Never invent fields. Check a real response first.

## Stack

* Next.js (App Router) + TypeScript (strict), **Bun** as runtime and package manager
* Tailwind CSS v4, inline utility classes only (tokens live in `app/globals.css`)
* Framer Motion (`motion` components) for all animation
* UI primitives from libraries.dev where one exists; otherwise build in `components/ui/`
* `next-themes` for light/dark, `zod` for runtime validation of API data

Commands: `bun dev`, `bun run build`, `bun run lint`, `bunx tsc --noEmit`.
Run lint and typecheck before saying a task is done. Never use npm, yarn or pnpm.

## Hard rules

1. **No `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx` is a
   client component.** Pages are server components that only render one component
   and fetch no data inline. `export const metadata` / `generateMetadata` lives here.
2. Route content lives in `components/<route_name>/<file>.tsx`. One folder per
   route, mirroring `app/`. Client-only parts get `"use client"` at the top of
   that component file, never in the page.
3. Global pieces (navbar, footer, buttons, theme toggle, providers) live in
   `components/layout/`. Generic primitives live in `components/ui/`.
4. `"use client"` only where needed (state, effects, Framer Motion, WebSocket,
   browser APIs). Push it as far down the tree as possible.
5. Inline Tailwind only. No CSS modules, no styled-components, no new global CSS
   beyond tokens in `globals.css`.
6. Every animated component respects `prefers-reduced-motion` (use
   `useReducedMotion` or `MotionConfig reducedMotion="user"`).
7. TypeScript: no `any`, no non-null `!` on external data, no `@ts-ignore`.
   External data is parsed with zod at the boundary and typed from the schema.

## Design

* Floating, centered navbar (`components/layout/navbar.tsx`).
* Interactive feel: hover/press states, shared-layout transitions, springy but
  short motion (150 to 400 ms). Nothing that blocks reading.
* **Dark theme is strictly black, white and grey tints.** No hues anywhere in the
  dark theme, and keep the light theme neutral too. Status is therefore never
  carried by colour alone: use icon, fill vs outline, label text and shape.
* Search bar styled like libraries.dev/beam. Search triggers a full-screen
  loading transition into a full-page tx details view.
* Reference structure and design language: the `teachmint` repo.
* Fonts: Inter (`--font-inter`), Inter Tight (`--font-inter-tight`, headings),
  Geist Mono (`--font-geist-mono`, hashes and addresses). Load them with
  `next/font` in `app/layout.tsx`.

## Folder layout

```
app/                      routes only: page.tsx / layout.tsx / metadata
  robots.ts  sitemap.ts  manifest.ts  opengraph-image.tsx
  api/                    route handlers (server-side proxy to the indexer)
components/
  layout/                 navbar, footer, theme-toggle, providers
  ui/                     buttons, badges, skeletons, generic primitives
  <route_name>/           one folder per route (home/, tx/, live/, ...)
hooks/                    client hooks (use-live-feed, use-debounce, ...)
lib/
  api/                    typed client, zod schemas, error types
  config.ts               validated env access (server and public split)
  seo.ts                  site metadata helpers, JSON-LD builders
  security.ts             validators and sanitisers (tx hash, URLs)
  utils.ts                cn() and small pure helpers
```

## Backend API (bridgeIndexer)

| Endpoint | Notes |
| --- | --- |
| `GET /api/v2/analyse?transaction_hash=<sig>&chain=solana` | Use this. `TransactionResponse` with `transfers[]` (`TransferView`) |
| `GET /api/v1/analyse?...` | Frozen legacy shape. Do not build on it |
| `WS /api/v1/stream` | Pushes each persisted tx as JSON text. Payload is the **v1 tx shape**, not v2. Lossy. Check a real message before typing it |
| `GET /health` | Health |

There is **no list, search-by-wallet or stats endpoint yet**. Anything needing
them is built against a typed data layer in `lib/api/` with a mock
implementation behind a clear `TODO(backend)` marker, so swapping in the real
endpoint is a one-file change. Never fake data inside components.

Statuses: `Detected`, `Pending`, `Completed`, `Failed`, `Refunded`.
`Pending` means WormholeScan has no destination tx yet, which is a valid state,
not an error. Chains can be unresolved (`chain: null`): render the raw
`protocol` + `id`, never crash. `source_tx_hash` is null for a redeem whose
origin tx is not known yet.

The API is rate limited upstream and can return 503 under load. Handle 400
(bad hash), 404, 429, 503 and network failure as distinct states with distinct
copy.

## Live feed behaviour

* Connect only when the user opens the Live route; idle otherwise.
* Keep the last N rows and keep the WebSocket connected across route changes and
  refreshes for the session; close only when the tab/app closes. This state
  lives in a provider mounted high in the tree (`components/layout/providers.tsx`),
  persisted to `sessionStorage` (validated with zod on read).
* Reconnect with capped exponential backoff plus jitter. Expose connection state
  (`connecting`, `open`, `reconnecting`, `closed`). De-duplicate by tx hash.
* Validate every message with zod. Drop and count malformed ones; never throw
  inside the socket handler.

## SEO

* Metadata via the Metadata API only (`metadata` / `generateMetadata`): title
  template, description, canonical, Open Graph, Twitter card, `metadataBase`
  from `NEXT_PUBLIC_SITE_URL`.
* `app/robots.ts`, `app/sitemap.ts`, `app/manifest.ts`, `app/opengraph-image.tsx`.
* JSON-LD (`WebSite` with `SearchAction`, `WebApplication`) rendered from
  `lib/seo.ts` in a server component, serialised safely (escape `<`).
* Tx detail pages: unique title and description built from the real transfer
  data, `canonical` set, and `robots: noindex` for transactions that do not
  exist. The live route is `noindex`.
* Semantic HTML: one `h1` per page, landmarks (`header`, `nav`, `main`,
  `footer`), real `<a>` links, `alt` text, visible focus rings, correct
  heading order. Keep Core Web Vitals in mind: no layout shift from fonts or
  loaders, lazy-load below-the-fold motion.

## Security

* **Secrets never reach the browser.** Only `NEXT_PUBLIC_*` values are public.
  The indexer's origin IP/URL is server-only (`API_BASE_URL`), and the browser
  talks to Next route handlers under `app/api/`, which proxy to the indexer.
  This also avoids mixed-content blocks while the backend is plain HTTP.
* Route handlers: validate and allowlist inputs (tx hash format and length,
  `chain` enum), set a fetch timeout, cap response size, never forward arbitrary
  headers, return generic error bodies, add basic per-IP rate limiting.
* Security headers in `next.config.ts` (and a CSP set per request with a nonce
  through the framework's request interception file): `Content-Security-Policy`,
  `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`
  (deny camera, microphone, geolocation), `frame-ancestors 'none'`,
  `poweredByHeader: false`. CSP `connect-src` must list only the exact WS and
  API origins in use.
* **Treat API data as untrusted.** Render as text, never `dangerouslySetInnerHTML`
  (the only exception is the JSON-LD script with escaped output). Explorer URLs
  from the API are rendered as links only if they parse as `https:` and the host
  is on an allowlist in `lib/security.ts`; links get
  `rel="noopener noreferrer"` and `target="_blank"`.
* Validate the WebSocket URL is `wss:` in production. Never interpolate user
  input into URLs without `encodeURIComponent`.
* No `eval`, no inline event-handler strings, no unpinned third-party scripts.
  Run `bun audit` (or equivalent) before releasing and keep dependencies minimal.
* Do not log full request bodies or user queries to the console in production.

## Working style

* Read the relevant files before editing. Keep diffs small and focused.
* Do not add dependencies without saying why. Prefer what is already installed.
* If a requirement conflicts with these rules, stop and ask rather than bend a rule.
* When unsure about the backend's shape, say so and ask for a sample response
  instead of guessing.
