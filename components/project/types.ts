export type Block =
	| { t: "p"; text: string }
	| { t: "ul"; items: string[] }
	| { t: "ol"; items: string[] }
	| { t: "checks"; items: { done: boolean; text: string }[] }
	| { t: "table"; label?: string; head: string[]; rows: string[][] }
	| { t: "code"; label?: string; code: string }
	| { t: "note"; text: string };

export type Sub = { id: string; title: string; blocks: Block[] };

export type Section = {
	slug: string;
	group: string;
	title: string;
	description: string;
	intro: Block[];
	subs: Sub[];
};

export type NavItem = { slug: string; title: string; subs: { id: string; title: string }[] };
export type NavGroup = { title: string; items: NavItem[] };