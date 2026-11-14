import type { TransferView } from "@/lib/api/schemas";

export const MAX_TRANSFER_ENTRIES = 500;

type TransferIdentity = Pick<
  TransferView,
  "observed_tx_hash" | "event_index"
>;

type TransferHashSource = Pick<
  TransferView,
  "source_tx_hash" | "destination_tx_hash" | "observed_tx_hash"
>;

type TransferAmountSource = Pick<
  TransferView,
  "amount_formatted" | "token_symbol"
>;

type TransferTimestampSource = Pick<
  TransferView,
  "first_seen_at" | "updated_at"
>;

/**
 * The backend identifies a transfer by the Solana transaction it was decoded
 * from plus its position in that transaction, so one tx can hold several rows.
 */
export function transferKey(transfer: TransferIdentity): string {
  return `${transfer.observed_tx_hash}:${transfer.event_index}`;
}

/**
 * The hash shown in the feed. A CCTP redeem may have no known origin tx yet,
 * so fall back to the destination and then the observed Solana transaction.
 */
export function transferHash(transfer: TransferHashSource): string {
  return (
    transfer.source_tx_hash ??
    transfer.destination_tx_hash ??
    transfer.observed_tx_hash
  );
}

/**
 * The formatted amount with its symbol when the indexer knows it. `null` means
 * the amount could not be formatted (CCTP often has only the raw integer).
 */
export function transferAmountLabel(
  transfer: TransferAmountSource,
): string | null {
  if (transfer.amount_formatted === null) {
    return null;
  }

  return transfer.token_symbol === null
    ? transfer.amount_formatted
    : `${transfer.amount_formatted} ${transfer.token_symbol}`;
}

/**
 * Epoch milliseconds for the Time column, when the list item carries one.
 * `null` means the response has no timestamp to show.
 */
export function transferTimestamp(
  transfer: TransferTimestampSource,
): number | null {
  return transfer.first_seen_at ?? transfer.updated_at ?? null;
}

/**
 * Newest first, de-duplicated by transfer key. Items already in the list keep
 * their position; the incoming page wins for a key it also contains, so an
 * enrichment update (for example `Pending` to `Completed`) is reflected.
 */
export function mergeTransfers(
  existing: readonly TransferView[],
  incoming: readonly TransferView[],
  maxEntries = MAX_TRANSFER_ENTRIES,
): TransferView[] {
  const seen = new Set<string>();
  const head: TransferView[] = [];

  for (const transfer of incoming) {
    const key = transferKey(transfer);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    head.push(transfer);
  }

  const tail = existing.filter((transfer) => !seen.has(transferKey(transfer)));

  return [...head, ...tail].slice(0, maxEntries);
}
