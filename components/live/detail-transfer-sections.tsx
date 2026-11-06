"use client";

import { motion } from "framer-motion";
import type { DetailView } from "@/lib/detail";
import { DetailField } from "./detail-field";
import { DetailSection, sectionVariants } from "./detail-section";
import { RawJson } from "./raw-json";

export function DetailTransferSections({ detail }: { detail: DetailView }) {
  const bridgeEvent = detail.bridgeEvent;

  return (
    <>
      <DetailSection title="Token & amount">
        <DetailField
          label="Token"
          value={detail.tokenAddress}
          truncate
          mono
          copy
        />
        <DetailField label="Symbol" value={detail.tokenSymbol} />
        <DetailField label="Amount" value={detail.amountFormatted} mono />
        <DetailField label="Raw amount" value={detail.amountRaw} mono />
      </DetailSection>

      <DetailSection title="Wormhole message">
        <DetailField
          label="Emitter chain"
          value={detail.message?.emitterChain ?? null}
        />
        <DetailField
          label="Emitter address"
          value={detail.message?.emitterAddress ?? null}
          truncate
          mono
          copy
        />
        <DetailField
          label="Sequence"
          value={detail.message?.sequence ?? null}
          mono
        />
      </DetailSection>

      {bridgeEvent ? (
        <DetailSection title="Bridge event">
          <DetailField
            label="Sequence"
            value={String(bridgeEvent.sequence)}
            mono
          />
          <DetailField
            label="Emitter chain"
            value={bridgeEvent.emitter_chain}
            mono
          />
          <DetailField
            label="Emitter address"
            value={bridgeEvent.emitter_address}
            truncate
            mono
            copy
          />
          <DetailField label="Target chain" value={bridgeEvent.target_chain} />
          <DetailField label="Amount" value={bridgeEvent.amount} mono />
        </DetailSection>
      ) : null}

      <motion.div variants={sectionVariants} className="md:col-span-2">
        <RawJson value={detail.raw} />
      </motion.div>
    </>
  );
}
