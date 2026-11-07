"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useLiveSocket } from "@/hooks/use-live-socket";
import { ApiError } from "@/lib/api/errors";
import { fetchLiveSnapshot } from "@/lib/api/live";
import {
  getEntriesServerSnapshot,
  getEntriesSnapshot,
  getOpenedServerSnapshot,
  getOpenedSnapshot,
  markLiveOpened,
  pushLiveFrame,
  seedLiveEntries,
  subscribeEntries,
  subscribeOpened,
} from "@/lib/live-store";
import type {
  LiveConnectionStatus,
  StoreEntry,
  StreamFrame,
} from "@/types/hermit";

const SNAPSHOT_LIMIT = 100;
const SNAPSHOT_RETRY_DELAY_MS = 300;

type LiveContextValue = {
  entries: StoreEntry[];
  status: LiveConnectionStatus;
  /**
   * Server clock minus client clock in milliseconds, from the last successful
   * snapshot. `null` until a snapshot has been received.
   */
  clockOffsetMs: number | null;
  getByHash: (hash: string) => StoreEntry | undefined;
};

const LiveContext = createContext<LiveContextValue | null>(null);

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Owns the live feed for the whole session. Mounted once in the root layout, so
 * navigating away from `/txs` keeps the socket and the entries alive.
 *
 * Opening `/txs` seeds the store once from the global snapshot. Frames that
 * arrive while that request is in flight are buffered and applied after it, so
 * a slightly older snapshot can never overwrite a newer socket frame. Any
 * failure is silent: the buffered frames are flushed and the feed continues
 * with the WebSocket alone.
 */
export function LiveProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const onLiveRoute = pathname === "/txs";

  const entries = useSyncExternalStore(
    subscribeEntries,
    getEntriesSnapshot,
    getEntriesServerSnapshot,
  );
  const openedLive = useSyncExternalStore(
    subscribeOpened,
    getOpenedSnapshot,
    getOpenedServerSnapshot,
  );
  const [clockOffsetMs, setClockOffsetMs] = useState<number | null>(null);

  const bufferingRef = useRef(false);
  const bufferRef = useRef<StreamFrame[]>([]);

  const flushBuffer = useCallback(() => {
    if (!bufferingRef.current) {
      return;
    }

    bufferingRef.current = false;
    const frames = bufferRef.current;
    bufferRef.current = [];

    for (const frame of frames) {
      pushLiveFrame(frame);
    }
  }, []);

  const handleFrame = useCallback((frame: StreamFrame) => {
    if (bufferingRef.current) {
      bufferRef.current.push(frame);
      return;
    }

    pushLiveFrame(frame);
  }, []);

  // Marking the route is an external side effect; no React state is derived
  // here, so a route change never re-runs the socket setup.
  useEffect(() => {
    if (onLiveRoute) {
      markLiveOpened();
    }
  }, [onLiveRoute]);

  useEffect(() => {
    if (!onLiveRoute) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    bufferingRef.current = true;
    bufferRef.current = [];

    const loadSnapshot = async () => {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const snapshot = await fetchLiveSnapshot(
            controller.signal,
            SNAPSHOT_LIMIT,
          );

          if (cancelled) {
            return;
          }

          // Measure the clock before publishing rows, so the first render
          // already has the offset needed to age `first_seen_at`.
          setClockOffsetMs(snapshot.server_time - Date.now());
          seedLiveEntries(snapshot.items);
          return;
        } catch (error) {
          if (cancelled || controller.signal.aborted) {
            return;
          }

          // A missing endpoint will not appear on a retry, and a timeout
          // means it is not healthy enough to block the feed.
          if (
            error instanceof ApiError &&
            (error.kind === "not_found" || error.kind === "timeout")
          ) {
            return;
          }

          if (attempt === 1) {
            return;
          }

          await delay(SNAPSHOT_RETRY_DELAY_MS);

          if (cancelled || controller.signal.aborted) {
            return;
          }
        }
      }
    };

    loadSnapshot().finally(() => {
      if (!cancelled) {
        flushBuffer();
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
      flushBuffer();
    };
  }, [onLiveRoute, flushBuffer]);

  const status = useLiveSocket(onLiveRoute || openedLive, handleFrame);

  const getByHash = useCallback(
    (hash: string) => entries.find((entry) => entry.frame.hash === hash),
    [entries],
  );

  const value = useMemo(
    () => ({ entries, status, clockOffsetMs, getByHash }),
    [entries, status, clockOffsetMs, getByHash],
  );

  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}

export function useLive(): LiveContextValue {
  const context = useContext(LiveContext);

  if (context === null) {
    throw new Error("useLive must be used inside LiveProvider");
  }

  return context;
}
