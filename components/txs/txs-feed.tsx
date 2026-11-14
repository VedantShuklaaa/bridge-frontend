"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useRef } from "react";
import { LiveStatusBadge } from "@/components/live/live-status";
import { useLiveTransfers } from "@/hooks/use-live-transfers";
import {
  MAX_TRANSFER_ENTRIES,
  transferKey,
} from "@/lib/transfers";
import { cn } from "@/lib/utils";
import { TxsPagination } from "./txs-pagination";
import { TxsRow, TXS_COLUMNS } from "./txs-row";

const PAGE_SIZE = 15;
const MAX_PAGES = Math.max(1, Math.ceil(MAX_TRANSFER_ENTRIES / PAGE_SIZE));

function parsePage(raw: string | undefined): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(parsed) ? parsed : 1;
}

const COLUMN_TITLES = [
  "Time",
  "Transaction",
  "Amount",
  "Route",
  "Protocol",
  "Status",
] as const;

/**
 * Live transfers, newest first, from `GET /api/v2/transfers`.
 *
 * The first page is polled every five seconds; paging past it reads older
 * rows with the backend's cursor. The column ribbon and every row share one
 * grid template so the six fields stay aligned and evenly spaced.
 */
export function TxsFeed({ pageParam }: { pageParam?: string }) {
  const { entries, status, hasMore, loadingMore, loadOlder } =
    useLiveTransfers();

  const page = Math.min(Math.max(parsePage(pageParam), 1), MAX_PAGES);
  const start = (page - 1) * PAGE_SIZE;
  const rows = entries.slice(start, start + PAGE_SIZE);
  const loadedPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const totalPages = Math.max(loadedPages, page);
  const waitingForOlder = rows.length === 0 && hasMore;

  // A deep link (or a Next past the loaded rows) fetches cursor pages until
  // the requested page exists. The attempt key stops a failed fetch from
  // retrying in a tight loop, while still allowing a new page to try.
  const attemptedRef = useRef<string | null>(null);
  useEffect(() => {
    if (rows.length > 0 || !hasMore || loadingMore) {
      return;
    }

    const attemptKey = `${page}:${entries.length}`;
    if (attemptedRef.current === attemptKey) {
      return;
    }

    attemptedRef.current = attemptKey;
    loadOlder();
  }, [entries.length, hasMore, loadingMore, loadOlder, page, rows.length]);

  const emptyCopy =
    status === "open"
      ? "Waiting for the next bridge transfer…"
      : status === "reconnecting"
        ? "Reconnecting to the live feed…"
        : "Loading recent transfers…";

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

            {waitingForOlder ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                Loading older transfers…
              </p>
            ) : rows.length === 0 ? (
              <p className="px-3 py-10 text-center text-sm text-muted-foreground">
                No transfers at this page.
              </p>
            ) : (
              <ul>
                <AnimatePresence initial={false}>
                  {rows.map((transfer) => (
                    <TxsRow
                      key={transferKey(transfer)}
                      transfer={transfer}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          <TxsPagination
            page={page}
            totalPages={totalPages}
            hasMore={hasMore}
          />
        </>
      )}
    </section>
  );
}
