import type { StoreEntry, StreamFrame } from "@/types/hermit";

export const MAX_LIVE_ENTRIES = 500;

/**
 * The time a row is ordered by. Snapshot rows carry the indexer's
 * `first_seen_at`; legacy WS rows fall back to when this browser saw them.
 */
function sortTime(entry: StoreEntry): number {
  return entry.frame.first_seen_at ?? entry.frame.updated_at ?? entry.receivedAt;
}

/**
 * A frame from the WebSocket is the freshest source we have. It wins unless
 * both sides carry `updated_at` and the socket frame is older (out-of-order
 * delivery), in which case the newer row is kept.
 */
function liveFrameWins(incoming: StreamFrame, current: StreamFrame): boolean {
  if (incoming.updated_at === undefined || current.updated_at === undefined) {
    return true;
  }

  return incoming.updated_at >= current.updated_at;
}

/**
 * A snapshot is authoritative for rows the browser has never seen, but it must
 * not roll back a row the live socket already updated. Only a strictly newer
 * `updated_at` replaces an existing frame.
 */
function snapshotFrameWins(incoming: StreamFrame, current: StreamFrame): boolean {
  if (incoming.updated_at === undefined || current.updated_at === undefined) {
    return false;
  }

  return incoming.updated_at > current.updated_at;
}

/**
 * Inserts a new frame at the front, or replaces the frame for a hash already in
 * the list while keeping the row in place and the time this browser first saw
 * it. Newest first, capped at `MAX_LIVE_ENTRIES`.
 */
export function mergeFrame(
  entries: readonly StoreEntry[],
  frame: StreamFrame,
  receivedAt = Date.now(),
): StoreEntry[] {
  const existing = entries.findIndex((entry) => entry.frame.hash === frame.hash);

  if (existing !== -1) {
    const current = entries[existing];

    if (!liveFrameWins(frame, current.frame)) {
      return entries.slice();
    }

    const next = entries.slice();
    next[existing] = { frame, receivedAt: current.receivedAt };
    return next;
  }

  return [{ frame, receivedAt }, ...entries].slice(0, MAX_LIVE_ENTRIES);
}

/**
 * Merges a global snapshot into the current rows.
 *
 * Existing hashes never move: a row is replaced in place only when the
 * snapshot's `updated_at` is strictly newer. New hashes are inserted by
 * `first_seen_at` (newest first) around the existing order, and the result is
 * capped at `MAX_LIVE_ENTRIES`.
 */
export function mergeSnapshot(
  entries: readonly StoreEntry[],
  items: readonly StreamFrame[],
  receivedAt = Date.now(),
): StoreEntry[] {
  const positions = new Map(
    entries.map((entry, index) => [entry.frame.hash, index]),
  );
  const next = entries.slice();
  const additions: StoreEntry[] = [];

  for (const frame of items) {
    const index = positions.get(frame.hash);

    if (index !== undefined) {
      const current = next[index];

      if (snapshotFrameWins(frame, current.frame)) {
        next[index] = { frame, receivedAt: current.receivedAt };
      }

      continue;
    }

    additions.push({ frame, receivedAt });
  }

  if (additions.length === 0) {
    return next;
  }

  additions.sort((a, b) => sortTime(b) - sortTime(a));

  // Stable merge: existing rows keep their relative order, and new rows are
  // slotted in between them by first-seen time.
  const merged: StoreEntry[] = [];
  let left = 0;
  let right = 0;

  while (left < next.length && right < additions.length) {
    if (sortTime(next[left]) >= sortTime(additions[right])) {
      merged.push(next[left]);
      left += 1;
    } else {
      merged.push(additions[right]);
      right += 1;
    }
  }

  while (left < next.length) {
    merged.push(next[left]);
    left += 1;
  }

  while (right < additions.length) {
    merged.push(additions[right]);
    right += 1;
  }

  return merged.slice(0, MAX_LIVE_ENTRIES);
}
