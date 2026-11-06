"use client";

import { motion } from "framer-motion";
import type { LiveEvent } from "@/hooks/use-live-stream";

const short = (v: string) => (v.length > 14 ? `${v.slice(0, 6)}…${v.slice(-6)}` : v);

function pick(data: Record<string, unknown>, keys: string[]) {
	for (const k of keys) {
		const v = data[k];
		if (typeof v === "string" || typeof v === "number") return String(v);
	}
	return null;
}

export function LiveRow({ event }: { event: LiveEvent }) {
	const sig = pick(event.data, ["signature", "tx_signature", "tx_hash", "id"]);
	const from = pick(event.data, ["source_chain", "from_chain", "src_chain"]);
	const to = pick(event.data, ["dest_chain", "to_chain", "dst_chain"]);
	const amount = pick(event.data, ["amount"]);
	const symbol = pick(event.data, ["symbol", "token"]);
	const status = pick(event.data, ["status"]);

	const known = sig || from || to || amount;

	return (
		<motion.li
			layout
			initial={{ opacity: 0, y: -8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0 }}
			transition={{ duration: 0.2 }}
			className="flex items-center justify-between gap-4 border-b border-border py-3 text-sm"
		>
			{known ? (
				<>
					<span className="font-mono">{sig ? short(sig) : "—"}</span>
					<span className="text-muted-foreground">
						{from ?? "?"} → {to ?? "?"}
					</span>
					<span>
						{amount ?? ""} {symbol ?? ""}
					</span>
					{status && <span className="text-muted-foreground">{status}</span>}
				</>
			) : (
				<code className="truncate text-xs">{JSON.stringify(event.data)}</code>
			)}
		</motion.li>
	);
}