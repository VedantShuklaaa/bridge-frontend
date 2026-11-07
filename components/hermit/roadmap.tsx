"use client";

import { motion } from "framer-motion";
import { ROADMAP } from "@/lib/api/hermit";

export function Roadmap() {
	return (
		<ul className="space-y-3 font-mono text-sm">
			{ROADMAP.map((r, i) => (
				<motion.li
					key={r.text}
					initial={{ opacity: 0, x: "-1vw" }}
					whileInView={{
						opacity: 1,
						x: 0,
						transition: { duration: 0.4, delay: i * 0.06 },
					}}
					viewport={{ once: true, margin: "-5% 0px" }}
					className={r.done ? "text-black" : "text-black/50"}
				>
					<span className="mr-3 text-black/40">{r.done ? "[x]" : "[ ]"}</span>
					{r.text}
				</motion.li>
			))}
		</ul>
	);
}