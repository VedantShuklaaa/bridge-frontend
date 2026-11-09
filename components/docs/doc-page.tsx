import { headers } from "next/headers";
import type { Section } from "@/components/project/types";
import { getAdjacent } from "@/lib/docs";
import { serializeJsonLd } from "@/lib/security";
import { AUTHOR, SITE_NAME, absoluteUrl } from "@/lib/site";
import { Blocks } from "./blocks";
import { PageNav } from "./pageNav";

export async function DocPage({ section }: { section: Section }) {
	const { prev, next } = getAdjacent(section.slug);
	const url = absoluteUrl(`/docs/${section.slug}`);
	const nonce = (await headers()).get("x-nonce") ?? undefined;

	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "TechArticle",
		headline: section.title,
		description: section.description,
		url,
		mainEntityOfPage: url,
		inLanguage: "en",
		author: { "@type": "Person", name: AUTHOR },
		isPartOf: { "@type": "WebSite", name: SITE_NAME, url: absoluteUrl("/") },
	};

	return (
		<article aria-labelledby="page-title">
			<script
				type="application/ld+json"
				nonce={nonce}
				dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
			/>

			<header className="mb-10 border-b pb-8">
				<p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
					{section.group}
				</p>
				<h1 id="page-title" className="mt-3 text-3xl sm:text-4xl">
					{section.title}
				</h1>
				<p className="mt-4 max-w-[72ch] text-muted-foreground">{section.description}</p>
			</header>

			<Blocks blocks={section.intro} />

			{section.subs.map((sub) => (
				<section key={sub.id} className="mt-12">
					<h2 id={sub.id} className="mb-5 scroll-mt-20 text-xl">
						<a href={`#${sub.id}`} className="group">
							{sub.title}
							<span aria-hidden className="ml-2 opacity-0 transition-opacity group-hover:opacity-40">
								#
							</span>
						</a>
					</h2>
					<Blocks blocks={sub.blocks} />
				</section>
			))}

			<PageNav prev={prev} next={next} />
		</article>
	);
}
