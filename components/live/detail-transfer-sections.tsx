"use client";

import { motion } from "framer-motion";
import type { DetailView } from "@/lib/detail";
import { DetailField } from "./detail-field";
import { DetailSection, sectionVariants } from "./detail-section";
import { RawJson } from "./raw-json";

export function DetailTransferSections({ detail }: { detail: DetailView }) {
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

      {detail.message ? (
        <DetailSection title={detail.message.title}>
          {detail.message.fields.map((field) => (
            <DetailField
              key={field.label}
              label={field.label}
              value={field.value}
              mono={field.mono}
              truncate={field.truncate}
              copy={field.copy}
            />
          ))}
        </DetailSection>
      ) : null}

      <motion.div variants={sectionVariants} className="md:col-span-2">
        <RawJson value={detail.raw} />
      </motion.div>
    </>
  );
}
