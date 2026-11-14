"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchTransfers } from "@/lib/api/transfers";
import type { TransferView } from "@/lib/api/schemas";
import { mergeTransfers } from "@/lib/transfers";

const POLL_INTERVAL_MS = 5_000;
const PAGE_LIMIT = 100;

export type FeedStatus = "connecting" | "open" | "reconnecting";

export type LiveTransfers = {
  entries: TransferView[];
  status: FeedStatus;
  hasMore: boolean;
  loadingMore: boolean;
  /** Fetches the next keyset page and appends it. */
  loadOlder: () => void;
};

/**
 * The live table's data source: the newest page from `GET /api/transfers`,
 * refreshed every five seconds while the tab is visible.
 *
 * The first page is polled; older pages are read with the backend's opaque
 * cursor when the reader pages past what is loaded. Polling pauses (and any
 * in-flight request is aborted) while the tab is hidden.
 */
export function useLiveTransfers(): LiveTransfers {
  const [entries, setEntries] = useState<TransferView[]>([]);
  const [status, setStatus] = useState<FeedStatus>("connecting");
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  /** Cursor for the next older page. `undefined` until the first page loads. */
  const olderCursorRef = useRef<string | null | undefined>(undefined);
  const loadingMoreRef = useRef(false);
  const polledOnceRef = useRef(false);
  const pollAbortRef = useRef<AbortController | null>(null);
  const olderAbortRef = useRef<AbortController | null>(null);

  const loadNewest = useCallback(async (signal: AbortSignal) => {
    try {
      const page = await fetchTransfers({ limit: PAGE_LIMIT, signal });

      if (signal.aborted) {
        return;
      }

      setEntries((current) => mergeTransfers(current, page.items));

      // Polling must not reset cursor progress made by `loadOlder`.
      if (!polledOnceRef.current) {
        polledOnceRef.current = true;
        olderCursorRef.current = page.next_cursor;
        setHasMore(page.next_cursor !== null);
      }

      setStatus("open");
    } catch {
      if (!signal.aborted) {
        setStatus("reconnecting");
      }
    }
  }, []);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const clearTimer = () => {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
    };

    const schedule = () => {
      if (
        stopped ||
        inFlight ||
        timer !== null ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      timer = setTimeout(poll, POLL_INTERVAL_MS);
    };

    const poll = () => {
      timer = null;

      if (stopped || inFlight || document.visibilityState !== "visible") {
        return;
      }

      inFlight = true;
      const controller = new AbortController();
      pollAbortRef.current = controller;

      void loadNewest(controller.signal).finally(() => {
        inFlight = false;

        if (pollAbortRef.current === controller) {
          pollAbortRef.current = null;
        }

        schedule();
      });
    };

    const onVisibilityChange = () => {
      if (stopped) {
        return;
      }

      if (document.visibilityState === "visible") {
        clearTimer();
        poll();
        return;
      }

      // Hidden: stop the timer and drop the request instead of refreshing a
      // tab nobody is looking at. The finally above will not reschedule while
      // the document is hidden.
      clearTimer();
      pollAbortRef.current?.abort();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    if (document.visibilityState === "visible") {
      poll();
    }

    return () => {
      stopped = true;
      clearTimer();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      pollAbortRef.current?.abort();
      olderAbortRef.current?.abort();
      olderAbortRef.current = null;
    };
  }, [loadNewest]);

  const loadOlder = useCallback(() => {
    const cursor = olderCursorRef.current;

    if (loadingMoreRef.current || cursor === undefined || cursor === null) {
      return;
    }

    loadingMoreRef.current = true;
    setLoadingMore(true);

    const controller = new AbortController();
    olderAbortRef.current = controller;

    void (async () => {
      try {
        const page = await fetchTransfers({
          limit: PAGE_LIMIT,
          cursor,
          signal: controller.signal,
        });

        if (controller.signal.aborted) {
          return;
        }

        setEntries((current) => mergeTransfers(current, page.items));
        olderCursorRef.current = page.next_cursor;
        setHasMore(page.next_cursor !== null);
      } catch {
        // Keep the cursor; the next navigation past the loaded rows retries.
      } finally {
        loadingMoreRef.current = false;

        if (olderAbortRef.current === controller) {
          olderAbortRef.current = null;
          setLoadingMore(false);
        }
      }
    })();
  }, []);

  return { entries, status, hasMore, loadingMore, loadOlder };
}
