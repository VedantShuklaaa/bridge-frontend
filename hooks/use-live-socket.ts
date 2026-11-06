"use client";

import { useEffect, useRef, useState } from "react";
import { publicConfig } from "@/lib/config.public";
import {
  streamFrameSchema,
  type LiveConnectionStatus,
  type StreamFrame,
} from "@/types/hermit";

const INITIAL_DELAY_MS = 1_000;
const MAX_DELAY_MS = 15_000;

/**
 * Keeps one WebSocket alive while `enabled` is true. Reconnects with capped
 * exponential backoff plus jitter; malformed frames are dropped, never thrown.
 */
export function useLiveSocket(
  enabled: boolean,
  onFrame: (frame: StreamFrame) => void,
): LiveConnectionStatus {
  const [status, setStatus] = useState<LiveConnectionStatus>("connecting");
  const onFrameRef = useRef(onFrame);
  const droppedRef = useRef(0);

  useEffect(() => {
    onFrameRef.current = onFrame;
  }, [onFrame]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let stopped = false;

    const connect = () => {
      setStatus(attempts === 0 ? "connecting" : "reconnecting");
      socket = new WebSocket(publicConfig.wsUrl);

      socket.onopen = () => {
        attempts = 0;
        setStatus("open");
      };

      socket.onmessage = (event) => {
        if (typeof event.data !== "string") {
          return;
        }

        let raw: unknown;
        try {
          raw = JSON.parse(event.data);
        } catch {
          droppedRef.current += 1;
          return;
        }

        const parsed = streamFrameSchema.safeParse(raw);
        if (!parsed.success) {
          droppedRef.current += 1;
          return;
        }

        // Valid transactions that are not bridge transfers do not belong here.
        if (parsed.data.bridge_transfer === null) {
          return;
        }

        onFrameRef.current(parsed.data);
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        if (stopped) {
          return;
        }

        const delay = Math.min(
          INITIAL_DELAY_MS * 2 ** attempts,
          MAX_DELAY_MS,
        );
        // Jitter keeps many tabs from reconnecting in lockstep.
        const jittered = Math.round(delay * (0.75 + Math.random() * 0.25));
        attempts += 1;
        setStatus("reconnecting");
        retryTimer = setTimeout(connect, jittered);
      };
    };

    connect();

    return () => {
      stopped = true;
      if (retryTimer !== null) {
        clearTimeout(retryTimer);
      }
      socket?.close();
    };
  }, [enabled]);

  return status;
}
