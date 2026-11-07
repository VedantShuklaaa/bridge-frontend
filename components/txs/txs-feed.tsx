"use client";

import { AnimatePresence } from "framer-motion";
import { LiveStatusBadge } from "@/components/live/live-status";
import { useLive } from "@/components/live/live-provider";
import { cn } from "@/lib/utils";
import { TxsPagination } from "./txs-pagination";
import { TxsRow, TXS_COLUMNS } from "./txs-row";

const PAGE_SIZE = 15;

function parsePage(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

const COLUMN_TITLES = [
  "Time",
  "Source tx",
  "Amount",
  "Route",
  "Protocol",
  "Status",
] as const;

/**
 * Live transfers, newest first. The column ribbon and every row share one grid
 * template so the six fields stay aligned and evenly spaced.
 */
export function TxsFeed({ pageParam }: { pageParam?: string }) {
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
    <section aria-labelledby="txs-feed-heading" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="txs-feed-heading"
          className="text-sm font-medium text-muted-foreground"
        >
          Live transfers
        </h2>
        <LiveStatusBadge status={status} />
      </header>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {emptyCopy}
        </p>
      ) : (
        <>
          <div className="rounded-xl border border-border p-1">
            <div
              className={cn(
                "hidden border-b border-border px-3 py-2 text-[11px] tracking-wide text-muted-foreground uppercase md:grid",
                TXS_COLUMNS,
              )}
            >
              {COLUMN_TITLES.map((title) => (
                <span key={title}>{title}</span>
              ))}
            </div>

            <ul>
              <AnimatePresence initial={false}>
                {rows.map((entry) => (
                  <TxsRow key={entry.frame.hash} entry={entry} />
                ))}
              </AnimatePresence>
            </ul>
          </div>

          <TxsPagination page={page} totalPages={totalPages} />
        </>
      )}
    </section>
  );
}
