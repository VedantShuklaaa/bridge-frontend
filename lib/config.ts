import "server-only";
import { z } from "zod";

/**
 * Server-only configuration. `server-only` makes importing this module from a
 * client component a build error, so the indexer origin never reaches the
 * browser bundle.
 */

const serverEnvSchema = z.object({
  API_BASE_URL: z.string().url().default("http://localhost:8080"),
  API_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .max(60_000)
    .default(8_000),
});

const env = serverEnvSchema.parse({
  API_BASE_URL: process.env.API_BASE_URL,
  API_TIMEOUT_MS: process.env.API_TIMEOUT_MS,
});

export const serverConfig = {
  apiBaseUrl: env.API_BASE_URL.replace(/\/+$/, ""),
  apiTimeoutMs: env.API_TIMEOUT_MS,
} as const;
