"use client";
import { motion } from "framer-motion";
import { FEATURES } from "@/lib/api/hermit";

export function Features() {
	return (
		<div className="divide-y divide-black/10 border-y border-black/10">
			{FEATURES.map((f, i) => (
				<motion.article
					key={f.title}
					initial={{ opacity: 0, y: "2vh" }}
					whileInView={{
						opacity: 1,
						y: 0,
						transition: { duration: 0.5, delay: i * 0.05 },
					}}
					whileHover={{ x: "0.6vw", transition: { duration: 0.2 } }}
					viewport={{ once: true, margin: "-10% 0px" }}
					className="grid gap-2 py-6 sm:grid-cols-[14rem_1fr]"
				>
					<h3 className="font-medium">{f.title}</h3>
					<p className="text-sm text-black/60">{f.text}</p>
				</motion.article>
			))}
		</div>
	);
}