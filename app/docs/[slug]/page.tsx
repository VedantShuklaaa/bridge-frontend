import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocPage } from "@/components/docs/doc-page";
import { getSection, sections } from "@/lib/docs";
import { SITE_NAME, absoluteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
	return sections.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
	const { slug } = await params;
	const section = getSection(slug);
	if (!section) return {};
	const url = absoluteUrl(`/docs/${section.slug}`);
	const title = `${section.title} | ${SITE_NAME} docs`;
	return {
		title: section.title,
		description: section.description,
		alternates: { canonical: url },
		openGraph: {
			type: "article",
			url,
			title,
			description: section.description,
			siteName: SITE_NAME,
		},
		twitter: { card: "summary", title, description: section.description },
	};
}

export default async function DocRoute({ params }: Props) {
	const { slug } = await params;
	const section = getSection(slug);
	if (!section) notFound();

	return <DocPage section={section} />;
}
