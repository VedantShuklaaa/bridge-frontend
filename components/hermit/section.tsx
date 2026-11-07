import type { ReactNode } from "react";
import { Reveal } from "./reveal";

export function Section({
	id,
	label,
	title,
	children,
}: {
	id: string;
	label: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<section
			id={id}
			aria-labelledby={`${id}-title`}
			className="border-t border-black/10 py-24"
		>
			<Reveal>
				<p className="font-mono text-xs uppercase tracking-widest">
					{label}
				</p>
				<h2
					id={`${id}-title`}
					className="mt-3 max-w-2xl text-2xl font-medium tracking-tight sm:text-3xl"
				>
					{title}
				</h2>
			</Reveal>
			<div className="mt-12">{children}</div>
		</section>
	);
}