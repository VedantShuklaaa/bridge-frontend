import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl">Page not found</h1>
      <p className="text-muted-foreground">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-full border border-border px-4 py-2 text-sm transition-colors hover:bg-muted"
      >
        Back to search
      </Link>
    </section>
  );
}
