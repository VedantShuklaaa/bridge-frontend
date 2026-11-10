import { z } from "zod";

/**
 * The shape the indexer broadcasts on
 * `WS /api/v1/transactions/stream`.
 *
 * Field names and nullability mirror the backend's
 * `src/domain/transaction.rs` and `src/domain/bridge_transfer.rs`. Every frame
 * is parsed with `streamFrameSchema` before it reaches the store; nothing here
 * trusts the socket.
 */

export const CHAINS = [
  "Solana",
  "Ethereum",
  "Bsc",
  "Polygon",
  "Avalanche",
  "Arbitrum",
  "Optimism",
  "Gnosis",
  "Base",
  "Near",
] as const;

/** Chains with dedicated labels/icons. The backend may send others. */
export type KnownChain = (typeof CHAINS)[number];

export function isKnownChain(value: unknown): value is KnownChain {
  return typeof value === "string" && (CHAINS as readonly string[]).includes(value);
}

/**
 * Any chain name the indexer sends. The registry is dynamic, so this is not a
 * closed enum. Unknown numeric ids arrive as `{ Unknown: n }`.
 */
export const chainIdSchema = z.union([
  z.string().min(1),
  z.object({ Unknown: z.number().int().nonnegative() }),
]);

export type ChainId = z.infer<typeof chainIdSchema>;

export const bridgeStatusSchema = z.enum(["Detected", "Pending", "Completed"]);

export type BridgeStatus = z.infer<typeof bridgeStatusSchema>;

export const txStatusSchema = z.enum(["Success", "Failed"]);

export type TxStatus = z.infer<typeof txStatusSchema>;

export const bridgeMessageIdSchema = z.object({
  emitter_chain: z.number().int().nonnegative(),
  emitter_address: z.string(),
  sequence: z.number().int().nonnegative(),
});

export type BridgeMessageId = z.infer<typeof bridgeMessageIdSchema>;

export const bridgeTransferSchema = z.object({
  source_chain: chainIdSchema,
  source_tx_hash: z.string().nullable(),
  source_wallet: z.string().nullable(),
  source_explorer_url: z.string().nullable(),
  destination_chain: chainIdSchema,
  destination_wallet: z.string().nullable(),
  destination_tx_hash: z.string().nullable(),
  destination_explorer_url: z.string().nullable(),
  token: z.string().nullable(),
  token_symbol: z.string().nullable(),
  // Raw digit strings. Never convert these to Number.
  amount: z.string().nullable(),
  amount_formatted: z.string().nullable(),
  message_id: bridgeMessageIdSchema,
  status: bridgeStatusSchema,
});

export type BridgeTransfer = z.infer<typeof bridgeTransferSchema>;

export const bridgeEventSchema = z.object({
  sequence: z.number().int().nonnegative(),
  emitter_chain: z.string(),
  emitter_address: z.string(),
  target_chain: z.string().nullable(),
  amount: z.string().nullable(),
});

export type BridgeEvent = z.infer<typeof bridgeEventSchema>;

export const streamFrameSchema = z.object({
  hash: z.string().min(1),
  chain: z.string().min(1),
  status: txStatusSchema,
  slot: z.number().int().nonnegative(),
  /** Unix seconds. */
  timestamp: z.number().int().nullable(),
  fee_lamports: z.number().int().nonnegative(),
  signer: z.string().nullable(),
  bridge_event: bridgeEventSchema.nullable(),
  bridge_transfer: bridgeTransferSchema.nullable(),
  /**
   * Epoch milliseconds when the indexer first saw this transfer. Present on
   * `/api/v2/transfers/live` items; legacy WS frames omit it.
   */
  first_seen_at: z.number().int().nonnegative().optional(),
  /** Epoch milliseconds of the latest indexer update to this transfer. */
  updated_at: z.number().int().nonnegative().optional(),
});

export type StreamFrame = z.infer<typeof streamFrameSchema>;

export const storeEntrySchema = z.object({
  frame: streamFrameSchema,
  /** Epoch milliseconds at which this browser first saw the frame. */
  receivedAt: z.number().int().nonnegative(),
});

export type StoreEntry = z.infer<typeof storeEntrySchema>;

export type LiveConnectionStatus =
  | "connecting"
  | "open"
  | "reconnecting"
  | "closed";
