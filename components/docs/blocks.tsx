import type { Block } from "@/components/project/types";
import { CodeBlock } from "./codeBlock";
import { Inline } from "./inline";

export function Blocks({ blocks }: { blocks: Block[] }) {
	return (
		<div className="space-y-5">
			{blocks.map((block, i) => (
				<BlockView key={i} block={block} />
			))}
		</div>
	);
}

function BlockView({ block }: { block: Block }) {
	switch (block.t) {
		case "p":
			return (
				<p className="max-w-[72ch] text-foreground/90">
					<Inline text={block.text} />
				</p>
			);

		case "ul":
			return (
				<ul className="max-w-[72ch] list-disc space-y-2 pl-5 marker:text-muted-foreground">
					{block.items.map((item, i) => (
						<li key={i}>
							<Inline text={item} />
						</li>
					))}
				</ul>
			);

		case "ol":
			return (
				<ol className="max-w-[72ch] list-decimal space-y-2 pl-5 marker:text-muted-foreground">
					{block.items.map((item, i) => (
						<li key={i}>
							<Inline text={item} />
						</li>
					))}
				</ol>
			);

		case "checks":
			return (
				<ul className="max-w-[80ch] space-y-2.5">
					{block.items.map((item, i) => (
						<li key={i} className="flex gap-3">
							<span
								aria-hidden
								className={`mt-1 grid size-4 shrink-0 place-items-center rounded-sm border text-[10px] leading-none ${item.done ? "border-foreground bg-foreground text-background" : ""
									}`}
							>
								{item.done ? "✓" : ""}
							</span>
							<span className="sr-only">{item.done ? "Done: " : "Open: "}</span>
							<span className={item.done ? "" : "text-muted-foreground"}>
								<Inline text={item.text} />
							</span>
						</li>
					))}
				</ul>
			);

		case "table":
			return (
				<div
					role="region"
					aria-label={block.label ?? "Table"}
					tabIndex={0}
					className="overflow-x-auto rounded-lg border"
				>
					<table className="w-full min-w-[34rem] border-collapse text-left text-sm">
						<thead className="bg-muted text-xs uppercase tracking-wider text-muted-foreground">
							<tr>
								{block.head.map((h) => (
									<th key={h} scope="col" className="px-4 py-2.5 font-medium">
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody className="divide-y">
							{block.rows.map((row, i) => (
								<tr key={i}>
									{row.map((cell, j) =>
										j === 0 ? (
											<th key={j} scope="row" className="min-w-[9rem] px-4 py-3 text-left align-top font-medium">
												<Inline text={cell} />
											</th>
										) : (
											<td key={j} className="px-4 py-3 align-top text-muted-foreground">
												<Inline text={cell} />
											</td>
										),
									)}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			);

		case "code":
			return <CodeBlock code={block.code} label={block.label} />;

		case "note":
			return (
				<aside className="max-w-[72ch] border-l-2 border-foreground pl-4 text-muted-foreground">
					<Inline text={block.text} />
				</aside>
			);
	}
}