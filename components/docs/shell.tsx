"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { NavGroup } from "@/components/project/types";
import { Sidebar } from "./sidebar";

export function Shell({ groups, children }: { groups: NavGroup[]; children: React.ReactNode }) {
	const [open, setOpen] = useState(false);
	const closeRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!open) return;
		closeRef.current?.focus();

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setOpen(false);
		};
		document.addEventListener("keydown", onKey);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = prevOverflow;
		};
	}, [open]);

	return (
		<div className="min-h-dvh">
			<header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setOpen(true)}
						aria-label="Open navigation"
						aria-expanded={open}
						aria-controls="mobile-nav"
						className="grid size-9 place-items-center rounded-md border transition-colors hover:bg-accent lg:hidden"
					>
						<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
							<path d="M4 7h16M4 12h16M4 17h16" />
						</svg>
					</button>
					<Link href="/docs/overview" className="font-heading text-base font-medium tracking-tight">
						Hermit <span className="text-muted-foreground">docs</span>
					</Link>
				</div>
				<Link
					href="/"
					className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					Main site
				</Link>
			</header>

			<div className="lg:grid lg:grid-cols-[18rem_minmax(0,1fr)]">
				<aside
					aria-label="Documentation"
					className="sticky top-14 hidden h-[calc(100dvh-3.5rem)] overflow-y-auto border-r lg:block"
				>
					<Sidebar groups={groups} />
				</aside>
				{/* The root layout already provides the `main` landmark. */}
				<div className="min-w-0 px-5 py-10 sm:px-8 lg:px-12 lg:py-14">
					{children}
				</div>
			</div>

			<AnimatePresence>
				{open && (
					<>
						<motion.div
							key="overlay"
							aria-hidden
							className="fixed inset-0 z-50 bg-foreground/40 lg:hidden"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							onClick={() => setOpen(false)}
						/>
						<motion.aside
							key="drawer"
							id="mobile-nav"
							role="dialog"
							aria-modal="true"
							aria-label="Navigation"
							className="fixed inset-y-0 left-0 z-50 w-[min(20rem,85vw)] overflow-y-auto border-r bg-background lg:hidden"
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={{ type: "tween", duration: 0.2 }}
							// Close the drawer after following a link.
							onClick={(event) => {
								if (event.target instanceof Element && event.target.closest("a")) {
									setOpen(false);
								}
							}}
						>
							<div className="flex h-14 items-center justify-between border-b px-4">
								<span className="font-heading font-medium">Navigation</span>
								<button
									ref={closeRef}
									type="button"
									onClick={() => setOpen(false)}
									aria-label="Close navigation"
									className="grid size-9 place-items-center rounded-md border transition-colors hover:bg-accent"
								>
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
										<path d="M6 6l12 12M18 6L6 18" />
									</svg>
								</button>
							</div>
							<Sidebar groups={groups} />
						</motion.aside>
					</>
				)}
			</AnimatePresence>
		</div>
	);
}