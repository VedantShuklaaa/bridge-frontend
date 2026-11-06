"use client";

import { useSyncExternalStore } from "react";

const TICK_MS = 1000;

const listeners = new Set<() => void>();
let currentNow = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;

function tick() {
  currentNow = Date.now();
  for (const listener of listeners) {
    listener();
  }
}

/**
 * One timer for every caller. Rows subscribe to the same module-level store,
 * so a page with fifty rows still runs a single one-second interval.
 */
function subscribe(listener: () => void) {
  currentNow = Date.now();
  listeners.add(listener);

  if (timer === null) {
    timer = setInterval(tick, TICK_MS);
  }

  return () => {
    listeners.delete(listener);

    if (listeners.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

function getSnapshot() {
  return currentNow;
}

function getServerSnapshot() {
  return 0;
}

/** The shared clock, updated once a second. */
export function useNow(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
