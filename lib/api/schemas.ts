import { z } from "zod";

/**
 * Schemas for `GET /api/v2/analyse` (bridgeIndexer `TransactionResponse`).
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

export const transferViewSchema = z.object({
  protocol: z.string(),
  // TODO(verify): backend serialises `Direction` as "Outbound" | "Inbound";
  // kept loose until a real response is checked.
  direction: z.unknown(),
  // TODO(verify): backend serialises `Option<Via>`; kept loose.
  via: z.unknown(),
  observed_tx_hash: z.string(),
  event_index: z.number().int().nonnegative(),
  // TODO(verify): backend serialises a protocol-tagged `MessageId`; kept loose.
  message_id: z.unknown(),
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
  amount_raw: z.string().nullable(),
  amount_formatted: z.string().nullable(),
  status: transferStatusSchema,
});

export type TransferView = z.infer<typeof transferViewSchema>;

export const transactionResponseSchema = z.object({
  hash: z.string(),
  chain: chainViewSchema,
  // TODO(verify): backend `TxStatus` is "Success" | "Failed"; kept loose until a
  // real response is checked.
  status: z.unknown(),
  slot: z.number().int().nonnegative(),
  timestamp: z.number().int().nullable(),
  fee_lamports: z.number().int().nonnegative(),
  signer: z.string().nullable(),
  transfers: z.array(transferViewSchema),
});

export type TransactionResponse = z.infer<typeof transactionResponseSchema>;
