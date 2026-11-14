import { z } from "zod";
import { streamFrameSchema } from "@/types/hermit";

/**
 * Schemas for `GET /api/v2/transactions/analyse` (bridgeIndexer
 * `TransactionResponse`).
 *
 * Field names and nullability mirror the backend's `src/domain/api.rs`. Amounts
 * stay strings: they can exceed Number.MAX_SAFE_INTEGER.
 */

export const transferStatusSchema = z.enum([
  "Detected",
  "Pending",
  "Completed",
  "Failed",
  "Refunded",
]);

export type TransferStatus = z.infer<typeof transferStatusSchema>;

export const chainDetailsSchema = z.object({
  id: z.number().int(),
  slug: z.string(),
  name: z.string(),
});

export type ChainDetails = z.infer<typeof chainDetailsSchema>;

/** A chain in the protocol's namespace plus the registry's answer when known. */
export const chainViewSchema = z.object({
  protocol: z.string(),
  id: z.string(),
  chain: chainDetailsSchema.nullable(),
});

export type ChainView = z.infer<typeof chainViewSchema>;

export const tokenViewSchema = z.object({
  chain: chainViewSchema.nullable(),
  address: z.string(),
});

export type TokenView = z.infer<typeof tokenViewSchema>;

export const directionSchema = z.enum(["Outbound", "Inbound"]);

export type Direction = z.infer<typeof directionSchema>;

export const viaSchema = z
  .object({
    name: z.string(),
    reference: z.string().nullable(),
  })
  .nullable();

export type Via = z.infer<typeof viaSchema>;

export const wormholeMessageIdSchema = z.object({
  protocol: z.literal("wormhole"),
  emitter_chain: z.number().int().nonnegative(),
  emitter_address: z.string(),
  sequence: z.number().int().nonnegative(),
});

export const cctpMessageIdSchema = z.object({
  protocol: z.literal("cctp"),
  source_domain: z.number().int().nonnegative(),
  nonce: z.string(),
});

export const debridgeMessageIdSchema = z.object({
  protocol: z.literal("debridge"),
  order_id: z.string(),
});

export const mayanMessageIdSchema = z.object({
  protocol: z.literal("mayan"),
  order_hash: z.string(),
});

/**
 * Protocol-tagged message identity. Unknown or future protocols (and any
 * variant whose fields differ from the above) still parse, so a new backend
 * protocol never turns a valid transaction into a 502.
 */
export const messageIdSchema = z.union([
  wormholeMessageIdSchema,
  cctpMessageIdSchema,
  debridgeMessageIdSchema,
  mayanMessageIdSchema,
  z.object({ protocol: z.string() }).passthrough(),
]);

export type MessageId = z.infer<typeof messageIdSchema>;

export const transferViewSchema = z.object({
  protocol: z.string(),
  program: z.string().optional(),
  protocol_name: z.string().optional(),
  direction: directionSchema,
  via: viaSchema,
  observed_tx_hash: z.string(),
  event_index: z.number().int().nonnegative(),
  message_id: messageIdSchema,
  source: chainViewSchema,
  destination: chainViewSchema,
  source_wallet: z.string().nullable(),
  destination_wallet: z.string().nullable(),
  source_tx_hash: z.string().nullable(),
  destination_tx_hash: z.string().nullable(),
  source_explorer_url: z.string().nullable(),
  destination_explorer_url: z.string().nullable(),
  token: tokenViewSchema.nullable(),
  token_symbol: z.string().nullable(),
  // Decimal strings, not numbers: raw amounts can exceed Number.MAX_SAFE_INTEGER.
  amount_raw: z.string().nullable(),
  amount_formatted: z.string().nullable(),
  status: transferStatusSchema,
});

export type TransferView = z.infer<typeof transferViewSchema>;

export const txStatusSchema = z.enum(["Success", "Failed"]);

export type TxStatus = z.infer<typeof txStatusSchema>;

export const transactionResponseSchema = z.object({
  hash: z.string(),
  chain: chainViewSchema,
  status: txStatusSchema,
  slot: z.number().int().nonnegative(),
  /** Unix seconds, matching the backend's `Option<i64>` timestamp. */
  timestamp: z.number().int().nullable(),
  fee_lamports: z.number().int().nonnegative(),
  signer: z.string().nullable(),
  transfers: z.array(transferViewSchema),
});

export type TransactionResponse = z.infer<typeof transactionResponseSchema>;

/**
 * `GET /api/v2/transfers/live` — the bounded, globally shared snapshot.
 *
 * Each item is the same frame the WebSocket broadcasts, plus optional
 * `first_seen_at` / `updated_at` epoch-millisecond timestamps. `server_time` is
 * also epoch milliseconds and is used to correct for clock skew between the
 * indexer and the browser.
 */
export const liveSnapshotSchema = z.object({
  items: z.array(z.unknown()).transform((raw) =>
    raw.flatMap((item) => {
      const parsed = streamFrameSchema.safeParse(item);
      if (!parsed.success) {
        console.warn("live: skipped invalid item", parsed.error.issues[0]?.path);
        return [];
      }
      return [parsed.data];
    }),
  ),
  next_cursor: z.string().nullable(),
  total: z.number().int().nonnegative(),
  server_time: z.number().int().nonnegative(),
});

export type LiveSnapshot = z.infer<typeof liveSnapshotSchema>;
