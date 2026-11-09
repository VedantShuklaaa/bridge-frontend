import { Fragment } from "react";

export function Inline({ text }: { text: string }) {
	const parts = text.split(/(`[^`]+`)/g);
	return (
		<>
			{parts.map((part, i) =>
				part.length > 2 && part.startsWith("`") && part.endsWith("`") ? (
					<code key={i} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">
						{part.slice(1, -1)}
					</code>
				) : (
					<Fragment key={i}>{part}</Fragment>
				),
			)}
		</>
	);
}