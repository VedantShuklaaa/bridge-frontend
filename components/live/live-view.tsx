"use client";

import { AnimatePresence } from "framer-motion";
import { useLive } from "./live-provider";
import { LivePagination } from "./live-pagination";
import { LiveRow } from "./live-row";
import { LiveStatusBadge } from "./live-status";

const PAGE_SIZE = 15;

function parsePage(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

export function LiveView({ pageParam }: { pageParam?: string }) {
  const { entries, status } = useLive();

  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const page = Math.min(Math.max(parsePage(pageParam), 1), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const rows = entries.slice(start, start + PAGE_SIZE);

  const emptyCopy =
    status === "open"
      ? "Waiting for the next bridge transfer…"
      : status === "reconnecting"
        ? "Reconnecting to the live feed…"
        : status === "closed"
          ? "The live feed is disconnected."
          : "Connecting to the live feed…";

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-12">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Live</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bridge transfers as the indexer sees them.
          </p>
        </div>
        <LiveStatusBadge status={status} />
      </header>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyCopy}
        </p>
      ) : (
        <>
          <ul className="rounded-xl border border-border p-1">
            <AnimatePresence initial={false}>
              {rows.map((entry) => (
                <LiveRow key={entry.frame.hash} entry={entry} />
              ))}
            </AnimatePresence>
          </ul>
          <LivePagination page={page} totalPages={totalPages} />
        </>
      )}
    </section>
  );
}
