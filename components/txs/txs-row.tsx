"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import type { ReactNode } from "react";
import { useNow } from "@/hooks/use-now";
import type { TransferStatus, TransferView } from "@/lib/api/schemas";
import { formatElapsed, shortHash } from "@/lib/format";
import { formatChainView, protocolDisplayName } from "@/lib/protocol";
import {
  transferAmountLabel,
  transferHash,
  transferTimestamp,
} from "@/lib/transfers";
import { cn } from "@/lib/utils";

/**
 * The summary row shared by the column ribbon and every feed row. Six equal
 * columns at `md` and up; a two-column labelled stack on smaller screens.
 */
export const TXS_COLUMNS =
  "grid-cols-2 gap-x-4 gap-y-2 md:grid-cols-6 md:items-center md:gap-x-4";

/** Shapes keep status readable without relying on colour. */
const statusShape: Record<TransferStatus, string> = {
  Completed: "rounded-full bg-current",
  Pending: "rounded-full border border-current bg-transparent",
  Detected: "rounded-[2px] border border-current bg-transparent",
  Failed: "rounded-[2px] bg-current",
  Refunded: "rounded-full border border-dashed border-current bg-transparent",
};

export function TxsRow({ transfer }: { transfer: TransferView }) {
  const now = useNow();
  const hash = transferHash(transfer);
  const amount = transferAmountLabel(transfer);
  const seenAt = transferTimestamp(transfer);

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
        href={`/txs/${encodeURIComponent(transfer.observed_tx_hash)}`}
        className={cn(
          "grid rounded-lg px-3 py-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:bg-muted",
          TXS_COLUMNS,
        )}
      >
        <Cell label="Time">
          {/*
           * Use the indexer's timestamp when the list item carries one. If it
           * does not, show nothing rather than inventing a time.
           */}
          <span
            className="tabular text-xs text-muted-foreground"
            title={
              seenAt === null
                ? "The transfers list does not carry a timestamp"
                : undefined
            }
          >
            {seenAt === null ? "—" : formatElapsed(seenAt, now)}
          </span>
        </Cell>

        <Cell label="Transaction">
          <span title={hash} className="block truncate font-mono text-xs">
            {shortHash(hash)}
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
            {formatChainView(transfer.source)}
            <span aria-hidden className="px-1 text-muted-foreground">
              →
            </span>
            {formatChainView(transfer.destination)}
          </span>
        </Cell>

        <Cell label="Protocol">
          <span className="block truncate">
            {protocolDisplayName(transfer)}
          </span>
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
