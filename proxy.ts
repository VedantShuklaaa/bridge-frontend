import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { publicConfig } from "./lib/config.public";

/**
 * Per-request nonce-based CSP. Every page is dynamically rendered so the nonce
 * Next extracts from this header can be attached to framework and page scripts.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const isDev = process.env.NODE_ENV === "development";

  // Only same-origin traffic and the exact configured stream and API origins.
  const connectSources = new Set([
    "'self'",
    publicConfig.wsOrigin,
    publicConfig.apiOrigin,
  ]);
  if (isDev) {
    const wsScheme = request.nextUrl.protocol === "https:" ? "wss" : "ws";
    connectSources.add(`${wsScheme}://${request.nextUrl.host}`);
  }

  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${
      isDev ? " 'unsafe-eval'" : ""
    }`,
    // Deliberately no nonce here. Framer Motion (and later border-beam) inject
    // inline styles at runtime; adding a nonce makes browsers ignore
    // 'unsafe-inline' under CSP3 and breaks them.
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "font-src 'self'",
    `connect-src ${[...connectSources].join(" ")}`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    ...(isDev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("Content-Security-Policy", csp);

  return response;
}

export const config = {
  matcher: [
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
