import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto flex justify-center h-screen max-w-3xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl leading-none mx-auto">Page not found</h1>
      <p className="text-muted-foreground leading-none mx-auto">
        The page you are looking for does not exist.
      </p>
      <Link
        href="/"
        className="rounded-xl border border-black/20 dark:border-white/20 px-4 py-2 text-sm transition-colors hover:bg-muted mx-auto"
      >
        Back to search
      </Link>
    </section>
  );
}
