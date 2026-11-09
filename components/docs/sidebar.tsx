"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavGroup } from "@/components/project/types";
import { useActiveHeading } from "@/hooks/useActiveHeading";

export function Sidebar({ groups }: { groups: NavGroup[] }) {
	const pathname = usePathname();
	const current = groups.flatMap((g) => g.items).find((i) => pathname === `/docs/${i.slug}`);
	const active = useActiveHeading(current?.subs.map((s) => s.id) ?? []);

	return (
		<nav aria-label="Docs" className="px-4 py-6">
			{groups.map((group) => (
				<div key={group.title} className="mb-7">
					<p className="mb-2 px-3 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
						{group.title}
					</p>
					<ul className="space-y-0.5">
						{group.items.map((item) => {
							const isCurrent = item.slug === current?.slug;
							return (
								<li key={item.slug}>
									<Link
										href={`/docs/${item.slug}`}
										aria-current={isCurrent ? "page" : undefined}
										className={`block rounded-md px-3 py-1.5 text-sm transition-colors ${isCurrent
												? "bg-accent font-medium text-foreground"
												: "text-muted-foreground hover:bg-accent hover:text-foreground"
											}`}
									>
										{item.title}
									</Link>

									<AnimatePresence initial={false}>
										{isCurrent && item.subs.length > 0 && (
											<motion.ul
												key="subs"
												initial={{ height: 0, opacity: 0 }}
												animate={{ height: "auto", opacity: 1 }}
												exit={{ height: 0, opacity: 0 }}
												transition={{ duration: 0.2 }}
												className="ml-3 mt-1 overflow-hidden border-l"
											>
												{item.subs.map((s) => (
													<li key={s.id}>
														<Link
															href={`/docs/${item.slug}#${s.id}`}
															className={`block py-1 pl-3 text-[13px] transition-colors ${active === s.id
																	? "-ml-px border-l border-foreground text-foreground"
																	: "text-muted-foreground hover:text-foreground"
																}`}
														>
															{s.title}
														</Link>
													</li>
												))}
											</motion.ul>
										)}
									</AnimatePresence>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}