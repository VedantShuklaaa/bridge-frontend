# Claude Code prompt: foundation (structure, SEO, security)

***

Read `CLAUDE.md` and `AGENTS.md` fully first, and follow them strictly. Also read the
Next.js docs that `AGENTS.md` points to, because this Next.js version may differ from
what you know (for example the request interception file may be `proxy.ts` instead of
`middleware.ts`). Use Bun only.

This task builds the **foundation only**: structure, providers, typed API layer, SEO and
security. Do **not** build the real pages' UI yet (navbar design, search, tx details,
live feed). I will describe those next. Leave each route as a minimal placeholder
component so the app builds and runs.

## 1. Dependencies

Install with Bun: `framer-motion` (import from `framer-motion`), `next-themes`, `zod`,
`clsx`, `tailwind-merge`. Nothing else without telling me why. Confirm Tailwind v4 is
already working with the existing `app/globals.css` (do not rewrite its tokens).

## 2. `globals.css` additions (append, do not replace)

* `html { color-scheme: light; }` and `.dark { color-scheme: dark; }`
* A visible `:focus-visible` style using `--ring` (2px outline, 2px offset)
* Slim neutral scrollbar styling for both themes
* Utility class `.tabular` => `font-variant-numeric: tabular-nums` for amounts
* Keep dark mode strictly black/white/grey. Add no hues.

## 3. Fonts and root layout (`app/layout.tsx`, server component)

* Load Inter (`--font-inter`), Inter Tight (`--font-inter-tight`) and Geist Mono
  (`--font-geist-mono`) with `next/font`, `display: "swap"`, applied on `<html>`.
* `<html lang="en" suppressHydrationWarning>`.
* Wrap children in `components/layout/providers.tsx` (client): `next-themes`
  `ThemeProvider` (`attribute="class"`, `defaultTheme="system"`, `enableSystem`,
  `disableTransitionOnChange`) and `MotionConfig reducedMotion="user"`.
* Render `<Navbar />` and `<Footer />` from `components/layout/` as placeholders
  (floating centered navbar shell with a theme toggle; minimal footer). Real design
  comes later.
* Skip-to-content link as the first focusable element, `<main id="content">`.

## 4. Folder structure

Create exactly this, with minimal placeholders, each page a **server component that only
renders its component**:

```
app/
  page.tsx                      -> <HomeView />
  tx/[hash]/page.tsx            -> <TxView hash={...} />   (validate hash, notFound() if invalid)
  live/page.tsx                 -> <LiveView />
  not-found.tsx, error.tsx*, loading.tsx
  robots.ts, sitemap.ts, manifest.ts, opengraph-image.tsx
  api/analyse/route.ts          -> proxy to the indexer
components/
  layout/   navbar.tsx footer.tsx theme-toggle.tsx providers.tsx
  ui/       (empty for now, add .gitkeep)
  home/     home-view.tsx
  tx/       tx-view.tsx
  live/     live-view.tsx
hooks/      (empty for now, .gitkeep)
lib/        api/ config.ts seo.ts security.ts utils.ts
```

`*` `error.tsx` must be a client component because Next.js requires it. This is the only
allowed exception to "no client page-level files"; keep it a thin wrapper that renders
`components/layout/error-view.tsx` (client). Never put logic in it.

No `page.tsx` or `layout.tsx` may contain `"use client"`.

## 5. Typed API layer (`lib/api/`)

* `schemas.ts`: zod schemas and inferred types for the indexer's `/api/v2/analyse`
  response: `TransactionResponse` { hash, chain: ChainView, status, slot, timestamp
  (number|null), fee\_lamports, signer (string|null), transfers: TransferView\[] },
  `TransferView` { protocol, direction, via, observed\_tx\_hash, event\_index, message\_id,
  source, destination, source\_wallet, destination\_wallet, source\_tx\_hash,
  destination\_tx\_hash, source\_explorer\_url, destination\_explorer\_url, token,
  token\_symbol, amount\_raw, amount\_formatted, status }, `ChainView` { protocol, id,
  chain: { id, slug, name } | null }, `TokenView` { chain: ChainView | null, address }.
  `TransferStatus` = Detected | Pending | Completed | Failed | Refunded. Use
  `.passthrough()` or `z.unknown()` for `message_id`, `via`, `direction` and the
  top-level `status` until we confirm real values, and add a `TODO(verify)` comment.
  Numeric amounts stay **strings** (they can exceed 2^53).
* `errors.ts`: `ApiError` with a `kind`: `invalid_input | not_found | rate_limited |
  unavailable | timeout | network | bad_response`.
* `client.ts`: `fetchAnalysis(hash, signal?)` calls **our own** `/api/analyse` route
  (never the indexer directly), parses with zod, maps HTTP status to `ApiError`.
  Works on the server (absolute URL from `NEXT_PUBLIC_SITE_URL`) and the client.
* `live.ts`: a zod schema for the WebSocket message **marked `TODO(verify)`**: it is
  the v1 tx shape. Make it lenient and keep only `hash` required until I give a sample.
* `mock.ts`: a clearly-labelled `TODO(backend)` mock for list/stats endpoints that
  don't exist yet, behind interfaces in `lib/api/index.ts`. Components never import
  mock data directly.

## 6. Proxy route handler (`app/api/analyse/route.ts`)

* `GET` only. Read `transaction_hash` and optional `chain` from the query string.
* Validate with `lib/security.ts`: tx hash must be a Solana signature (base58 charset,
  length 86 to 88); `chain` must be in an allowlist (`["solana"]`). Return 400 with a
  generic JSON error otherwise.
* Fetch `${API_BASE_URL}/api/v2/analyse` with `encodeURIComponent` params, an
  `AbortController` timeout from `API_TIMEOUT_MS`, `cache: "no-store"`, no forwarded
  client headers. Cap the upstream body size (reject above ~512 KB).
* Parse the upstream JSON with the zod schema before returning it. On parse failure
  return 502 `bad_response`.
* Map: upstream 404 => 404, 429 => 429 with `Retry-After` if present, 5xx or abort =>
  503/504. Responses use generic messages, never upstream error text or the upstream URL.
* Add a small in-memory per-IP sliding-window rate limiter in `lib/security.ts`
  (for example 60 req/min). Note in a comment that it is per-instance and what to
  replace it with at scale.
* Response headers: `Cache-Control: no-store` for errors, short `s-maxage` with
  `stale-while-revalidate` only for fully `Completed` transactions.

## 7. `lib/security.ts`

* `isValidSolanaSignature`, `isAllowedChain`
* `safeExternalUrl(url)`: returns the URL only if it parses, is `https:`, has no
  credentials, and its hostname is in `EXPLORER_HOST_ALLOWLIST` (solscan.io,
  etherscan.io, basescan.org, arbiscan.io, optimistic.etherscan.io, polygonscan.com,
  bscscan.com, snowtrace.io, celoscan.io, wormholescan.io; make it easy to extend);
  otherwise `null`. Every explorer link in the app goes through this.
* `serializeJsonLd(obj)`: `JSON.stringify` then escape `<`, `>` and `&` as unicode.
* Rate limiter from section 6, plus unit-testable pure helpers.

## 8. Security headers and CSP

* `next.config.ts`: `poweredByHeader: false`, `reactStrictMode: true`, and `headers()`
  returning for all routes: `Strict-Transport-Security` (max-age 63072000,
  includeSubDomains), `X-Content-Type-Options: nosniff`, `Referrer-Policy:
  strict-origin-when-cross-origin`, `Permissions-Policy` (camera, microphone,
  geolocation, payment all empty), `X-Frame-Options: DENY`,
  `Cross-Origin-Opener-Policy: same-origin`.
* A per-request **nonce-based CSP** in the request interception file (`middleware.ts`
  or `proxy.ts`, whichever this Next version uses): `default-src 'self'`,
  `script-src 'self' 'nonce-…' 'strict-dynamic'` (+ `'unsafe-eval'` in dev only),
  `style-src 'self' 'unsafe-inline'` (needed by Framer Motion inline styles; leave a
  comment), `img-src 'self' data:`, `font-src 'self'`, `connect-src 'self'` plus the
  exact origin of `NEXT_PUBLIC_WS_URL`, `frame-ancestors 'none'`, `base-uri 'self'`,
  `form-action 'self'`, `object-src 'none'`, `upgrade-insecure-requests` in production.
  Pass the nonce through a request header so `lib/seo.ts` can put it on the JSON-LD
  script. Matcher must exclude static assets and `_next`.
* `lib/config.ts`: validate env with zod at startup. Public and server-only values in
  separate exports. In production, fail if `NEXT_PUBLIC_WS_URL` is not `wss:` or
  `NEXT_PUBLIC_SITE_URL` is not `https:`. `API_BASE_URL` must never be importable from
  client code (add `import "server-only"` and install `server-only`).

## 9. SEO

* `lib/seo.ts`: `siteConfig` (name "bridgeIndexer", description, URL), a
  `buildMetadata({ title, description, path, noindex })` helper, and JSON-LD builders
  for `WebSite` (with `SearchAction` pointing at the tx route) and `WebApplication`.
* Root `metadata`: `metadataBase`, title template (`%s | bridgeIndexer`), description,
  canonical, Open Graph, Twitter `summary_large_image`, `applicationName`, `robots`.
* Per route: home (indexable), `tx/[hash]` via `generateMetadata` (title with a
  shortened hash, `noindex` for now, canonical set), live (`noindex`).
* `robots.ts`: allow `/`, disallow `/api/`, `/live`, point to the sitemap.
  `sitemap.ts`: home only (tx pages are dynamic and not listed).
  `manifest.ts`: name, short\_name, theme/background colours from the neutral palette,
  icons from `public/`.
* `opengraph-image.tsx`: a simple black/white/grey branded image using `ImageResponse`.
* Render JSON-LD in the root layout through one small server component, using
  `serializeJsonLd` and the CSP nonce.
* Semantics: one `h1` per page, landmarks, skip link, no layout shift from fonts.

## 10. Done criteria

* `bun run lint`, `bunx tsc --noEmit` and `bun run build` all pass with zero warnings
  you introduced.
* `grep` confirms no `page.tsx`/`layout.tsx` contains `"use client"`.
* `grep` confirms `API_BASE_URL` is not referenced outside `lib/config.ts` and
  `app/api/`.
* Add unit tests (Bun's test runner) for `isValidSolanaSignature`, `safeExternalUrl`,
  `serializeJsonLd` and the rate limiter.
* Finish with a short report: files created, any assumption you made, anything marked
  `TODO(verify)` or `TODO(backend)`, and anything in this prompt you could not do.

Do not build real UI beyond placeholders. Stop after the report.
