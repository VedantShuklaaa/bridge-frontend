"use client";

import {
	animate,
	motion,
	useInView,
	useMotionValue,
	useReducedMotion,
	useTransform,
} from "framer-motion";
import { useEffect, useRef } from "react";

export function CountUp({ to, decimals = 0 }: { to: number; decimals?: number }) {
	const ref = useRef<HTMLSpanElement>(null);
	const inView = useInView(ref, { once: true, margin: "-10% 0px" });
	const reduce = useReducedMotion();
	const value = useMotionValue(0);
	const text = useTransform(value, (v) => v.toFixed(decimals));

	useEffect(() => {
		if (!inView) return;
		if (reduce) {
			value.set(to);
			return;
		}
		const controls = animate(value, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
		return () => controls.stop();
	}, [inView, reduce, to, value]);

	return <motion.span ref={ref}>{text}</motion.span>;
}