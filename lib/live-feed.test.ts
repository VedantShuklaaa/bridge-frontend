import { describe, expect, test } from "bun:test";
import { MAX_LIVE_ENTRIES, mergeFrame, mergeSnapshot } from "./live-feed";
import type { StoreEntry, StreamFrame } from "@/types/hermit";

function frame(
  hash: string,
  overrides: Partial<StreamFrame> = {},
): StreamFrame {
  return {
    hash,
    chain: "Solana",
    status: "Success",
    slot: 1,
    timestamp: 1_700_000_000,
    fee_lamports: 5_000,
    signer: null,
    bridge_event: null,
    bridge_transfer: null,
    ...overrides,
  };
}

function entry(
  hash: string,
  options: { receivedAt?: number; first_seen_at?: number; updated_at?: number } = {},
): StoreEntry {
  return {
    frame: frame(hash, {
      first_seen_at: options.first_seen_at,
      updated_at: options.updated_at,
    }),
    receivedAt: options.receivedAt ?? 1_000,
  };
}

describe("mergeFrame", () => {
  test("prepends a new hash and caps the list", () => {
    const existing = Array.from({ length: MAX_LIVE_ENTRIES }, (_, index) =>
      entry(`h${index}`),
    );

    const result = mergeFrame(existing, frame("new"), 2_000);

    expect(result).toHaveLength(MAX_LIVE_ENTRIES);
    expect(result[0]?.frame.hash).toBe("new");
    expect(result[0]?.receivedAt).toBe(2_000);
  });

  test("updates an existing row in place and keeps its first-seen time", () => {
    const existing = mergeFrame([], frame("a"), 1_000);

    const result = mergeFrame(
      existing,
      frame("a", { status: "Failed" }),
      2_000,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.frame.status).toBe("Failed");
    expect(result[0]?.receivedAt).toBe(1_000);
  });

  test("keeps the current frame when the socket frame is older", () => {
    const existing = [entry("a", { updated_at: 200 })];

    const result = mergeFrame(existing, frame("a", { updated_at: 100 }), 300);

    expect(result[0]?.frame.updated_at).toBe(200);
  });
});

describe("mergeSnapshot", () => {
  test("inserts new rows by first_seen_at, newest first", () => {
    const result = mergeSnapshot(
      [],
      [
        frame("old", { first_seen_at: 100 }),
        frame("new", { first_seen_at: 300 }),
        frame("mid", { first_seen_at: 200 }),
      ],
      999,
    );

    expect(result.map((item) => item.frame.hash)).toEqual([
      "new",
      "mid",
      "old",
    ]);
  });

  test("never reorders existing rows", () => {
    const existing = [
      entry("b", { first_seen_at: 300 }),
      entry("a", { first_seen_at: 100 }),
    ];

    const result = mergeSnapshot(
      existing,
      [frame("c", { first_seen_at: 200 })],
      999,
    );

    expect(result.map((item) => item.frame.hash)).toEqual(["b", "c", "a"]);
  });

  test("replaces a row only when the snapshot is strictly newer", () => {
    const existing = [entry("a", { first_seen_at: 100, updated_at: 100 })];

    const result = mergeSnapshot(
      existing,
      [frame("a", { first_seen_at: 100, updated_at: 200, status: "Failed" })],
      999,
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.frame.updated_at).toBe(200);
    expect(result[0]?.receivedAt).toBe(1_000);
  });

  test("does not replace a live frame that has no updated_at", () => {
    const existing = [entry("a", { first_seen_at: 100 })];

    const result = mergeSnapshot(
      existing,
      [frame("a", { first_seen_at: 100, updated_at: 200, status: "Failed" })],
      999,
    );

    expect(result[0]?.frame.updated_at).toBeUndefined();
  });

  test("caps the merged list", () => {
    const items = Array.from({ length: MAX_LIVE_ENTRIES + 10 }, (_, index) =>
      frame(`h${index}`, { first_seen_at: index }),
    );

    const result = mergeSnapshot([], items, 999);

    expect(result).toHaveLength(MAX_LIVE_ENTRIES);
    expect(result[0]?.frame.hash).toBe(`h${MAX_LIVE_ENTRIES + 9}`);
  });
});
