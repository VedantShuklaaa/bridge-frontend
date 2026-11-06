"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useNow } from "@/hooks/use-now";
import { formatChain, formatElapsed, shortHash } from "@/lib/format";
import type { BridgeStatus, StoreEntry } from "@/types/hermit";

const statusShape: Record<BridgeStatus, string> = {
  Completed: "rounded-full bg-current",
  Pending: "rounded-full border border-current bg-transparent",
  Detected: "rounded-[2px] border border-current bg-transparent",
};

export function LiveRow({ entry }: { entry: StoreEntry }) {
  const now = useNow();
  const { frame, receivedAt } = entry;
  const transfer = frame.bridge_transfer;

  if (transfer === null) {
    return null;
  }

  const sourceHash = transfer.source_tx_hash ?? frame.hash;
  const detectedAt =
    receivedAt > 0
      ? receivedAt
      : frame.timestamp !== null
        ? frame.timestamp * 1000
        : now;

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
        href={`/live/${encodeURIComponent(frame.hash)}`}
        className="flex items-center gap-2 rounded-lg px-2 py-3 text-sm transition-colors hover:bg-muted/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:gap-3 sm:px-3 motion-safe:active:bg-muted"
      >
        <span className="w-9 shrink-0 tabular text-xs text-muted-foreground">
          {formatElapsed(detectedAt, now)}
        </span>

        <span className="min-w-0 flex-1 truncate font-mono text-xs">
          {shortHash(sourceHash)}
        </span>

        <span className="shrink-0 whitespace-nowrap text-[11px] sm:text-xs">
          {formatChain(transfer.source_chain)}
          <span aria-hidden className="px-1 text-muted-foreground">
            →
          </span>
          {formatChain(transfer.destination_chain)}
        </span>

        <span className="shrink-0 text-[10px] text-muted-foreground sm:text-xs">
          Wormhole
        </span>

        <span className="flex shrink-0 items-center gap-1.5 text-[11px] sm:text-xs">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 ${statusShape[transfer.status]}`}
          />
          {transfer.status}
        </span>
      </Link>
    </motion.li>
  );
}
