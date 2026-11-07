"use client";

import { motion } from "framer-motion";
import { ENDPOINTS } from "@/lib/api/hermit";

export function ApiBlock() {
	return (
		<div className="overflow-x-auto rounded-lg border border-black/10 p-6 font-mono text-sm">
			{ENDPOINTS.map((e, i) => (
				<motion.div
					key={e.path}
					initial={{ opacity: 0 }}
					whileInView={{
						opacity: 1,
						transition: { duration: 0.4, delay: i * 0.1 },
					}}
					whileHover={{ x: "0.4vw", transition: { duration: 0.15 } }}
					viewport={{ once: true }}
					className="flex gap-4 whitespace-nowrap py-2"
				>
					<span className="w-10 shrink-0 text-black/40">{e.method}</span>
					<span>{e.path}</span>
					<span className="hidden text-black/30 md:inline"># {e.note}</span>
				</motion.div>
			))}
		</div>
	);
}