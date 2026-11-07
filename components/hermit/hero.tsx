"use client";
import { HERMIT } from "@/lib/api/hermit";
import { motion } from "framer-motion";


function Cursor() {
	return (
		<motion.span
			aria-hidden
			className="ml-2 inline-block h-[0.8em] w-[0.08em] translate-y-[0.05em] bg-white"
			animate={{ opacity: [1, 1, 0, 0] }}
			transition={{ duration: 1.1, repeat: Infinity, ease: "linear", times: [0, 0.5, 0.5, 1] }}
		/>
	);
}

const ease = [0.22, 1, 0.36, 1] as const;

export function Hero() {
	return (
		<header className="flex min-h-screen flex-col justify-center">
			<motion.p
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.5 }}
				className="font-mono text-sm text-black/50"
			>
				{HERMIT.path}
			</motion.p>

			<motion.h1
				initial={{ opacity: 0, y: "3vh" }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, delay: 0.1, ease }}
				className="mt-4 text-6xl font-semibold tracking-tight sm:text-8xl"
			>
				{HERMIT.name}
				<Cursor />
			</motion.h1>

			<motion.p
				initial={{ opacity: 0, y: "2vh" }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, delay: 0.25, ease }}
				className="mt-4 font-mono text-sm text-black/60 sm:text-base"
			>
				{HERMIT.title}
			</motion.p>

			<motion.p
				initial={{ opacity: 0, y: "2vh" }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.7, delay: 0.35, ease }}
				className="mt-6 max-w-xl text-base text-black/70 sm:text-lg"
			>
				{HERMIT.intro}
			</motion.p>

			<motion.nav
				initial={{ opacity: 0 }}
				animate={{ opacity: 1 }}
				transition={{ duration: 0.7, delay: 0.5 }}
				className="mt-10 flex gap-6 font-mono text-sm"
			>
				<a
					href={HERMIT.repo}
					target="_blank"
					rel="noopener noreferrer"
					className="text-black/60 transition-colors hover:text-black"
				>
					GitHub ↗
				</a>
				<a
					href={HERMIT.home}
					className="text-black/60 transition-colors hover:text-black"
				>
					All projects
				</a>
			</motion.nav>
		</header>
	);
}