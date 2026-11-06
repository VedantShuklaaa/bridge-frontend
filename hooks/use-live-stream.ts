"use client";

import { useEffect, useRef, useState } from "react";

export type LiveStatus = "connecting" | "open" | "closed";

export type LiveEvent = {
	id: string;
	receivedAt: number;
	data: Record<string, unknown>;
};

const WS_URL = process.env.NEXT_PUBLIC_HERMIT_WS_URL;
const MAX_EVENTS = 50;

export function useLiveStream() {
	const [events, setEvents] = useState<LiveEvent[]>([]);
	const [status, setStatus] = useState<LiveStatus>("connecting");
	const retry = useRef(0);

	useEffect(() => {
		if (!WS_URL) {
			setStatus("closed");
			return;
		}

		let ws: WebSocket | null = null;
		let timer: ReturnType<typeof setTimeout> | undefined;
		let stopped = false;

		const connect = () => {
			setStatus("connecting");
			ws = new WebSocket(WS_URL);

			ws.onopen = () => {
				retry.current = 0;
				setStatus("open");
			};

			ws.onmessage = (msg) => {
				try {
					const data = JSON.parse(msg.data);
					if (typeof data !== "object" || data === null) return;
					setEvents((prev) =>
						[
							{ id: crypto.randomUUID(), receivedAt: Date.now(), data },
							...prev,
						].slice(0, MAX_EVENTS),
					);
				} catch {
					// ignore non-JSON frames (pings etc.)
				}
			};

			ws.onerror = () => ws?.close();

			ws.onclose = () => {
				setStatus("closed");
				if (stopped) return;
				const delay = Math.min(1000 * 2 ** retry.current++, 15000);
				timer = setTimeout(connect, delay);
			};
		};

		connect();

		return () => {
			stopped = true;
			if (timer) clearTimeout(timer);
			ws?.close();
		};
	}, []);

	return { events, status };
}