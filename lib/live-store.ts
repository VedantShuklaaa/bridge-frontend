import { mergeFrame, mergeSnapshot } from "@/lib/live-feed";
import type { StoreEntry, StreamFrame } from "@/types/hermit";

/**
 * A tiny external store for the live feed. Keeping it outside React lets every
 * row subscribe to the same snapshot and lets the socket outlive route changes.
 *
 * The indexer's snapshot is the source of truth. The store starts empty on a
 * hard reload and is seeded from `GET /api/live`; `sessionStorage` is no longer
 * read or written, so every browser converges on the same list.
 */

const SERVER_ENTRIES: StoreEntry[] = [];

let entries: StoreEntry[] = [];
const entryListeners = new Set<() => void>();

function notifyEntries() {
  for (const listener of entryListeners) {
    listener();
  }
}

export function subscribeEntries(listener: () => void): () => void {
  entryListeners.add(listener);
  return () => {
    entryListeners.delete(listener);
  };
}

export function getEntriesSnapshot(): StoreEntry[] {
  return entries;
}

export function getEntriesServerSnapshot(): StoreEntry[] {
  return SERVER_ENTRIES;
}

export function findLiveEntry(hash: string): StoreEntry | undefined {
  return entries.find((entry) => entry.frame.hash === hash);
}

/** Applies one WebSocket frame, keeping any newer version already in place. */
export function pushLiveFrame(frame: StreamFrame): void {
  entries = mergeFrame(entries, frame);
  notifyEntries();
}

/**
 * Applies a global snapshot. Existing rows never move; new rows are inserted by
 * `first_seen_at`, and only a strictly newer `updated_at` replaces a row.
 */
export function seedLiveEntries(
  items: readonly StreamFrame[],
  receivedAt = Date.now(),
): void {
  entries = mergeSnapshot(entries, items, receivedAt);
  notifyEntries();
}

/**
 * Whether this session has opened the live route at least once. Once true it
 * stays true, so the socket survives a navigation away from `/txs`.
 */
let openedLive = false;
const openedListeners = new Set<() => void>();

export function subscribeOpened(listener: () => void): () => void {
  openedListeners.add(listener);
  return () => {
    openedListeners.delete(listener);
  };
}

export function getOpenedSnapshot(): boolean {
  return openedLive;
}

export function getOpenedServerSnapshot(): boolean {
  return false;
}

export function markLiveOpened(): void {
  if (openedLive) {
    return;
  }

  openedLive = true;
  for (const listener of openedListeners) {
    listener();
  }
}
