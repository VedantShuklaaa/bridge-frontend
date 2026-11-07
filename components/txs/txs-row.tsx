"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useNow } from "@/hooks/use-now";
import { formatChain, formatElapsed, shortHash } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BridgeStatus, StoreEntry } from "@/types/hermit";

/**
 * The summary row shared by the column ribbon and every feed row. Six equal
 * columns at `md` and up; a two-column labelled stack on smaller screens.
 */
export const TXS_COLUMNS =
  "grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-6 md:items-center md:gap-x-4";

const statusShape: Record<BridgeStatus, string> = {
  Completed: "rounded-full bg-current",
  Pending: "rounded-full border border-current bg-transparent",
  Detected: "rounded-[2px] border border-current bg-transparent",
};

function amountLabel(entry: StoreEntry): string | null {
  const transfer = entry.frame.bridge_transfer;

  if (transfer === null || transfer.amount_formatted === null) {
    return null;
  }

  return transfer.token_symbol === null
    ? transfer.amount_formatted
    : `${transfer.amount_formatted} ${transfer.token_symbol}`;
}

export function TxsRow({
  entry,
  clockOffsetMs,
}: {
  entry: StoreEntry;
  clockOffsetMs: number | null;
}) {
  const now = useNow();
  const { frame, receivedAt } = entry;
  const transfer = frame.bridge_transfer;

  if (transfer === null) {
    return null;
  }

  const sourceHash = transfer.source_tx_hash ?? frame.hash;
  const firstSeenAt = frame.first_seen_at;
  // `first_seen_at` is on the indexer's clock; subtract the measured skew to
  // compare it with this browser's clock. Without a successful snapshot there
  // is no skew measurement, so fall back to when this browser received the row.
  const detectedAt =
    firstSeenAt !== undefined && clockOffsetMs !== null
      ? firstSeenAt - clockOffsetMs
      : receivedAt > 0
        ? receivedAt
        : frame.timestamp !== null
          ? frame.timestamp * 1000
          : now;
  const amount = amountLabel(entry);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="border-b border-border last:border-b-0"
    >
      <Link
        href={`/txs/${encodeURIComponent(frame.hash)}`}
        className={cn(
          "grid rounded-lg px-3 py-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:bg-muted",
          TXS_COLUMNS,
        )}
      >
        <Cell label="Time">
          <span className="tabular text-xs text-muted-foreground">
            {formatElapsed(detectedAt, now)}
          </span>
        </Cell>

        <Cell label="Source tx">
          <span
            title={sourceHash}
            className="block truncate font-mono text-xs"
          >
            {shortHash(sourceHash)}
          </span>
        </Cell>

        <Cell label="Amount">
          <span
            title={amount ?? undefined}
            className="tabular block truncate"
          >
            {amount ?? "—"}
          </span>
        </Cell>

        <Cell label="Route">
          <span className="block truncate whitespace-nowrap">
            {formatChain(transfer.source_chain)}
            <span aria-hidden className="px-1 text-muted-foreground">
              →
            </span>
            {formatChain(transfer.destination_chain)}
          </span>
        </Cell>

        <Cell label="Protocol">
          <span className="block truncate">Wormhole</span>
        </Cell>

        <Cell label="Status">
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 shrink-0",
                statusShape[transfer.status],
              )}
            />
            <span className="truncate">{transfer.status}</span>
          </span>
        </Cell>
      </Link>
    </motion.li>
  );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5 md:block">
      <span className="text-[10px] tracking-wide text-muted-foreground uppercase md:hidden">
        {label}
      </span>
      <span className="min-w-0">{children}</span>
    </span>
  );
}
