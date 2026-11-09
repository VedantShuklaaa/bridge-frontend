import Link from "next/link";

type Item = { slug: string; title: string };

export function PageNav({ prev, next }: { prev?: Item; next?: Item }) {
	return (
		<nav aria-label="Pagination" className="mt-16 grid gap-3 border-t pt-8 sm:grid-cols-2">
			{prev ? (
				<Link
					href={`/docs/${prev.slug}`}
					rel="prev"
					className="rounded-lg border p-4 transition-colors hover:bg-accent"
				>
					<span className="block text-xs text-muted-foreground">Previous</span>
					<span className="mt-1 block font-medium">{prev.title}</span>
				</Link>
			) : (
				<span />
			)}
			{next && (
				<Link
					href={`/docs/${next.slug}`}
					rel="next"
					className="rounded-lg border p-4 transition-colors hover:bg-accent sm:text-right"
				>
					<span className="block text-xs text-muted-foreground">Next</span>
					<span className="mt-1 block font-medium">{next.title}</span>
				</Link>
			)}
		</nav>
	);
}