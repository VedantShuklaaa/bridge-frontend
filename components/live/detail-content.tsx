"use client";

import { motion } from "framer-motion";
import type { DetailView } from "@/lib/detail";
import { formatBlockTime, formatSol, shortHash } from "@/lib/format";
import { safeExternalUrl } from "@/lib/security";
import { DetailField } from "./detail-field";
import { DetailSection } from "./detail-section";
import { DetailTransferSections } from "./detail-transfer-sections";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

export function DetailContent({
  detail,
  now,
}: {
  detail: DetailView;
  now: number;
}) {
  const timestamp = detail.timestamp;
  const blockTime =
    timestamp === null ? null : formatBlockTime(timestamp, now);
  const fee =
    detail.feeLamports === null
      ? null
      : `${formatSol(detail.feeLamports)} SOL`;

  return (
    <>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-wide text-muted-foreground uppercase">
            Transaction
          </p>
          <h1 className="font-mono text-lg sm:text-xl">
            {shortHash(detail.hash, 10, 10)}
          </h1>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs">
          <span
            aria-hidden
            className={`h-1.5 w-1.5 rounded-full ${
              detail.txStatus === "Success"
                ? "bg-current"
                : "border border-current"
            }`}
          />
          {detail.txStatus}
        </span>
      </header>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2"
      >
        <DetailSection title="Overview" className="md:col-span-2">
          <DetailField label="Hash" value={detail.hash} copy mono />
          <DetailField label="Tx status" value={detail.txStatus} />
          <DetailField
            label="Slot"
            value={detail.slot === null ? null : String(detail.slot)}
            mono
          />
          <DetailField label="Block time" value={blockTime} />
          <DetailField label="Signer" value={detail.signer} truncate mono />
          <DetailField label="Fee" value={fee} />
        </DetailSection>

        <DetailSection title="Route">
          <DetailField label="Source" value={detail.sourceChain} />
          <DetailField label="Destination" value={detail.destinationChain} />
          <DetailField label="Direction" value={detail.direction} />
          <DetailField label="Protocol" value={detail.protocol} />
          <DetailField label="Transfer status" value={detail.transferStatus} />
          {detail.transferCount > 1 ? (
            <DetailField
              label="Transfers"
              value={`${detail.transferCount} (showing the first)`}
            />
          ) : null}
        </DetailSection>

        <DetailSection title="Source">
          <DetailField
            label="Tx hash"
            value={detail.sourceTxHash}
            truncate
            mono
            copy
          />
          <DetailField
            label="Wallet"
            value={detail.sourceWallet}
            truncate
            mono
            copy
          />
          <DetailField
            label="Explorer"
            value={detail.sourceExplorerUrl}
            href={safeExternalUrl(detail.sourceExplorerUrl)}
          />
        </DetailSection>

        <DetailSection title="Destination">
          <DetailField
            label="Tx hash"
            value={detail.destinationTxHash}
            truncate
            mono
            copy
          />
          <DetailField
            label="Wallet"
            value={detail.destinationWallet}
            truncate
            mono
            copy
          />
          <DetailField
            label="Explorer"
            value={detail.destinationExplorerUrl}
            href={safeExternalUrl(detail.destinationExplorerUrl)}
          />
        </DetailSection>

        <DetailTransferSections detail={detail} />
      </motion.div>
    </>
  );
}
