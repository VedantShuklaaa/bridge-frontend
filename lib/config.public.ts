import { z } from "zod";

/**
 * Public configuration. Safe to import from client components: every value is
 * a `NEXT_PUBLIC_*` variable, inlined by Next at build time.
 *
 * The browser only talks to this app's own `/api/*` route handlers, so there
 * is no public indexer origin to configure.
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

const publicEnvSchema = z.object({
  siteUrl: absoluteUrl,
});

const parsed = publicEnvSchema.safeParse({
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
});

if (!parsed.success) {
  throw new Error(
    "Invalid NEXT_PUBLIC_* environment configuration: " +
    JSON.stringify(parsed.error.flatten().fieldErrors),
  );
}

const site = new URL(parsed.data.siteUrl);

// In production the public origin must be encrypted. Loopback stays exempt so
// a local production build/start works without a deployed origin.
if (process.env.NODE_ENV === "production") {
  if (!LOCAL_HOSTS.has(site.hostname) && site.protocol !== "https:") {
    throw new Error("NEXT_PUBLIC_SITE_URL must use https: in production.");
  }
}

export const publicConfig = {
  siteUrl: parsed.data.siteUrl.replace(/\/+$/, ""),
} as const;
