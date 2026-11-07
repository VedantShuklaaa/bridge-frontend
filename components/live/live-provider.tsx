"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { useLiveSocket } from "@/hooks/use-live-socket";
import {
  getEntriesServerSnapshot,
  getEntriesSnapshot,
  getOpenedServerSnapshot,
  getOpenedSnapshot,
  markLiveOpened,
  pushLiveFrame,
  subscribeEntries,
  subscribeOpened,
} from "@/lib/live-store";
import type { LiveConnectionStatus, StoreEntry } from "@/types/hermit";

type LiveContextValue = {
  entries: StoreEntry[];
  status: LiveConnectionStatus;
  getByHash: (hash: string) => StoreEntry | undefined;
};

const LiveContext = createContext<LiveContextValue | null>(null);

/**
 * Owns the live feed for the whole session. Mounted once in the root layout, so
 * navigating away from `/txs` keeps the socket and the entries alive.
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

  // Marking the route is an external side effect; no React state is derived
  // here, so a route change never re-runs the socket setup.
  useEffect(() => {
    if (onLiveRoute) {
      markLiveOpened();
    }
  }, [onLiveRoute]);

  const status = useLiveSocket(onLiveRoute || openedLive, pushLiveFrame);

  const getByHash = useCallback(
    (hash: string) => entries.find((entry) => entry.frame.hash === hash),
    [entries],
  );

  const value = useMemo(
    () => ({ entries, status, getByHash }),
    [entries, status, getByHash],
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
