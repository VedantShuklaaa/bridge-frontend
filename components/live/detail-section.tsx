"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export const sectionVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
};

export function DetailSection({
  title,
  className,
  children,
}: {
  title: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      variants={sectionVariants}
      className={cn(
        "rounded-xl border border-border bg-card/40 p-4 sm:p-5",
        className,
      )}
    >
      <h2 className="mb-2 font-heading text-sm font-medium tracking-tight">
        {title}
      </h2>
      <dl className="divide-y divide-border/60">{children}</dl>
    </motion.section>
  );
}
