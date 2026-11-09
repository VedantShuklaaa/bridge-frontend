import { CopyButton } from "./copyButton";

export function CodeBlock({ code, label }: { code: string; label?: string }) {
	return (
		<figure className="overflow-hidden rounded-lg border">
			<figcaption className="flex items-center justify-between border-b bg-muted px-4 py-1.5 font-mono text-xs text-muted-foreground">
				<span>{label ?? "text"}</span>
				<CopyButton text={code} />
			</figcaption>
			<pre tabIndex={0} className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
				<code>{code}</code>
			</pre>
		</figure>
	);
}