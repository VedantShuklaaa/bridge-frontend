"use client";

import { m, type Transition } from "framer-motion";
import Link from "next/link";

import type { NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

const pillTransition: Transition = {
	duration: 0.5,
	ease: [0.4, 0, 0.2, 1],
};

type NavLinkProps = {
	item: NavItem;
	active: boolean;
};

export function NavLink({ item, active }: NavLinkProps) {
	const className = cn(
		"relative isolate rounded-full px-2.5 py-1.5 text-[13px] transition-colors duration-500 ease-in-out sm:px-3 sm:text-sm",
		"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
		active ? "text-background" : "text-muted-foreground hover:text-foreground",
	);

	const content = (
		<>
			{active && (
				<m.span
					layoutId="nav-active"
					className="absolute inset-0 -z-10 rounded-md bg-foreground"
					transition={pillTransition}
				/>
			)}
			{item.label}
			{item.newTab && <span aria-hidden="true"> ↗</span>}
		</>
	);

	if (item.external) {
		return (
			<a
				href={item.href}
				target={item.newTab ? "_blank" : undefined}
				rel={item.newTab ? "noopener noreferrer" : undefined}
				className={className}
			>
				{content}
			</a>
		);
	}

	return (
		<Link
			href={item.href}
			aria-current={active ? "page" : undefined}
			className={className}
		>
			{content}
		</Link>
	);
}