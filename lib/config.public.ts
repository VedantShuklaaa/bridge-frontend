import { z } from "zod";

/**
 * Public configuration. Safe to import from client components: every value is
 * a `NEXT_PUBLIC_*` variable, inlined by Next at build time.
 */

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

const absoluteUrl = z.string().refine((value) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}, "must be an absolute URL");

const streamUrl = absoluteUrl.refine(
  (value) => value.startsWith("ws://") || value.startsWith("wss://"),
  "must use ws: or wss:",
);

const publicEnvSchema = z.object({
  siteUrl: absoluteUrl,
  wsUrl: streamUrl,
  apiUrl: absoluteUrl,
});

const parsed = publicEnvSchema.safeParse({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  wsUrl:
    process.env.NEXT_PUBLIC_HERMIT_WS_URL ??
    process.env.NEXT_PUBLIC_WS_URL ??
    "ws://localhost:8080/api/v1/transactions/stream",
  apiUrl: process.env.NEXT_PUBLIC_HERMIT_API_URL ?? "http://localhost:8080",
});

if (!parsed.success) {
  throw new Error("Invalid NEXT_PUBLIC_* environment configuration.");
}

const site = new URL(parsed.data.siteUrl);
const ws = new URL(parsed.data.wsUrl);
const api = new URL(parsed.data.apiUrl);

// In production the public origins must be encrypted. Loopback stays exempt so
// a local production build/start works without a deployed origin.
if (process.env.NODE_ENV === "production") {
  if (!LOCAL_HOSTS.has(site.hostname) && site.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use https: in production.");
  }
  if (!LOCAL_HOSTS.has(ws.hostname) && ws.protocol !== "wss:") {
    throw new Error("NEXT_PUBLIC_HERMIT_WS_URL must use wss: in production.");
  }
  if (!LOCAL_HOSTS.has(api.hostname) && api.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_HERMIT_API_URL must use https: in production.");
  }
}

export const publicConfig = {
  siteUrl: parsed.data.siteUrl.replace(/\/+$/, ""),
  wsUrl: parsed.data.wsUrl,
  wsOrigin: ws.origin,
  apiUrl: parsed.data.apiUrl.replace(/\/+$/, ""),
  apiOrigin: api.origin,
} as const;
