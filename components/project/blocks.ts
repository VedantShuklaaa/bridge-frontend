import type { Block } from "./types";

export const p = (text: string): Block => ({ t: "p", text });
export const ul = (...items: string[]): Block => ({ t: "ul", items });
export const ol = (...items: string[]): Block => ({ t: "ol", items });
export const note = (text: string): Block => ({ t: "note", text });
export const code = (code: string, label?: string): Block => ({ t: "code", code, label });
export const table = (head: string[], rows: string[][], label?: string): Block => ({
	t: "table",
	head,
	rows,
	label,
});
export const checks = (...items: [boolean, string][]): Block => ({
	t: "checks",
	items: items.map(([done, text]) => ({ done, text })),
});