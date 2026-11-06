import {
  mergeFrame,
  readStoredEntries,
  writeStoredEntries,
} from "@/lib/live-feed";
import type { StoreEntry, StreamFrame } from "@/types/hermit";

/**
 * A tiny external store for the live feed. Keeping it outside React lets the
 * provider hydrate from `sessionStorage` without a state-setting effect and
 * lets every row subscribe to the same snapshot.
 */

const SERVER_ENTRIES: StoreEntry[] = [];
const SAVE_DEBOUNCE_MS = 250;

let entries: StoreEntry[] = readStoredEntries();
let saveTimer: ReturnType<typeof setTimeout> | null = null;
const entryListeners = new Set<() => void>();

function scheduleSave() {
  if (typeof window === "undefined") {
    return;
  }

  if (saveTimer !== null) {
    clearTimeout(saveTimer);
  }

  saveTimer = setTimeout(() => {
    saveTimer = null;
    writeStoredEntries(entries);
  }, SAVE_DEBOUNCE_MS);
}

function notifyEntries() {
  for (const listener of entryListeners) {
    listener();
  }
  scheduleSave();
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

export function pushLiveFrame(frame: StreamFrame): void {
  entries = mergeFrame(entries, frame);
  notifyEntries();
}

/**
 * Whether this session has opened the live route at least once. Once true it
 * stays true, so the socket survives a navigation away from `/live`.
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
