import type { NavGroup, Section } from "@/components/project/types";
import { introduction } from "@/components/project/introduction";
import { internals } from "@/components/project/internals";
import { reference } from "@/components/project/reference";
import { project } from "@/components/project/projects";

export const sections: Section[] = [
	...introduction,
	...internals,
	...reference,
	...project,
];

export function getSection(slug: string) {
	return sections.find((s) => s.slug === slug);
}

export function getAdjacent(slug: string) {
	const i = sections.findIndex((s) => s.slug === slug);
	return { prev: sections[i - 1], next: sections[i + 1] };
}

const order: string[] = [];
for (const s of sections) if (!order.includes(s.group)) order.push(s.group);

export const navGroups: NavGroup[] = order.map((title) => ({
	title,
	items: sections
		.filter((s) => s.group === title)
		.map((s) => ({
			slug: s.slug,
			title: s.title,
			subs: s.subs.map(({ id, title }) => ({ id, title })),
		})),
}));