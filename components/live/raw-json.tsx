"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useState } from "react";

export function RawJson({ value }: { value: unknown }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const json = JSON.stringify(value, null, 2) ?? "";

  return (
    <section className="rounded-xl border border-border bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring sm:px-5"
      >
        <span className="font-heading text-sm font-medium">Raw payload</span>
        <span className="text-xs text-muted-foreground">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            id={panelId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <pre className="max-h-[28rem] overflow-auto p-4 font-mono text-xs leading-relaxed sm:p-5">
              {json}
            </pre>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
