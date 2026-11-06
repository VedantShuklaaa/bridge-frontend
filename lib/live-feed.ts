import {
  storedEntriesSchema,
  type StoreEntry,
  type StreamFrame,
} from "@/types/hermit";

export const LIVE_STORAGE_KEY = "bridge-indexer:live-feed:v1";
export const MAX_LIVE_ENTRIES = 500;

/**
 * Inserts a new frame at the front, or replaces the frame for a hash already in
 * the list while keeping the time this browser first saw it. Newest first,
 * capped at `MAX_LIVE_ENTRIES`.
 */
export function mergeFrame(
  entries: readonly StoreEntry[],
  frame: StreamFrame,
  receivedAt = Date.now(),
): StoreEntry[] {
  const existing = entries.findIndex((entry) => entry.frame.hash === frame.hash);

  if (existing !== -1) {
    const current = entries[existing];
    const next = entries.slice();
    next[existing] = { frame, receivedAt: current.receivedAt };
    return next;
  }

  return [{ frame, receivedAt }, ...entries].slice(0, MAX_LIVE_ENTRIES);
}

/** Reads the session mirror. Any failure (private mode, bad JSON) is an empty list. */
export function readStoredEntries(): StoreEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(LIVE_STORAGE_KEY);
    if (raw === null) {
      return [];
    }

    const parsed = storedEntriesSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data.slice(0, MAX_LIVE_ENTRIES) : [];
  } catch {
    return [];
  }
}

/** Writes the session mirror. Quota and privacy errors are ignored. */
export function writeStoredEntries(entries: readonly StoreEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(
      LIVE_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_LIVE_ENTRIES)),
    );
  } catch {
    // Storage can be unavailable or full; the in-memory feed still works.
  }
}
