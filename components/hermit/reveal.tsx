"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
	children,
	delay = 0,
	className,
}: {
	children: ReactNode;
	delay?: number;
	className?: string;
}) {
	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, y: "3vh" }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-10% 0px" }}
			transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
		>
			{children}
		</motion.div>
	);
}