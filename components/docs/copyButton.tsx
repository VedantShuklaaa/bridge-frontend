"use client";

import { useState } from "react";

export function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch { }
	}

	return (
		<button
			type="button"
			onClick={copy}
			aria-live="polite"
			className="rounded px-2 py-1 transition-colors hover:bg-accent hover:text-foreground"
		>
			{copied ? "Copied" : "Copy"}
		</button>
	);
}