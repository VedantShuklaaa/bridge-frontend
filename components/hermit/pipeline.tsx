"use client";
import { motion } from "framer-motion";
import { PIPELINE, STATUS_FLOW } from "@/lib/api/hermit";

export function Pipeline() {
	return (
		<div>
			<ol className="grid gap-px overflow-hidden rounded-lg border border-black/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
				{PIPELINE.map((step, i) => (
					<motion.li
						key={step.id}
						initial={{ opacity: 0, backgroundColor: "#ffffff", color: "#39393b" }}
						whileInView={{
							opacity: 1,
							transition: { duration: 0.5, delay: i * 0.08 },
						}}
						whileHover={{
							backgroundColor: "#39393b",
							color: "#ffffff",
							transition: { duration: 0.2 },
						}}
						viewport={{ once: true, margin: "-10% 0px" }}
						className="p-6"
					>
						<p className="font-mono text-xs opacity-40">{step.id}</p>
						<h3 className="mt-3 text-lg font-medium">{step.title}</h3>
						<p className="mt-2 text-sm opacity-60">{step.detail}</p>
					</motion.li>
				))}
			</ol>

			<div className="mt-16">
				<p className="font-mono text-xs uppercase tracking-widest text-black/40">
					status
				</p>
				<div className="relative mt-6">
					<motion.div
						aria-hidden
						className="absolute left-0 right-0 top-[7px] h-px bg-white/30"
						style={{ originX: 0 }}
						initial={{ scaleX: 0 }}
						whileInView={{ scaleX: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 1.2, ease: "easeInOut" }}
					/>
					<ul className="relative grid grid-cols-3">
						{STATUS_FLOW.map((s, i) => (
							<motion.li
								key={s.label}
								initial={{ opacity: 0 }}
								whileInView={{
									opacity: 1,
									transition: { duration: 0.4, delay: 0.3 + i * 0.35 },
								}}
								viewport={{ once: true }}
							>
								<span className="block h-3.5 w-3.5 rounded-full border border-black bg-white" />
								<p className="mt-4 text-sm font-medium">{s.label}</p>
								<p className="mt-1 text-xs text-black/50">{s.caption}</p>
							</motion.li>
						))}
					</ul>
				</div>
				<p className="mt-8 text-xs text-black/40">
					A redeem into Solana is Completed at detection. A status never moves backwards.
				</p>
			</div>
		</div>
	);
}