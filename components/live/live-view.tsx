"use client";

import { AnimatePresence } from "framer-motion";
import { useLiveStream } from "@/hooks/use-live-stream";
import { LiveRow } from "./live-row";
import { LiveStatusBadge } from "./live-status";

export function LiveView() {
  const { events, status } = useLiveStream();

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-3 px-4 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl">Live</h1>
        <LiveStatusBadge status={status} />
      </div>

      {events.length === 0 ? (
        <p className="text-muted-foreground">
          {status === "open"
            ? "Waiting for the next transfer…"
            : "Connecting to the feed…"}
        </p>
      ) : (
        <ul>
          <AnimatePresence initial={false}>
            {events.map((e) => (
              <LiveRow key={e.id} event={e} />
            ))}
          </AnimatePresence>
        </ul>
      )}
    </section>
  );
}