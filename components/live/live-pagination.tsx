import Link from "next/link";

function pageHref(page: number): string {
  return page <= 1 ? "/live" : `/live?page=${page}`;
}

export function LivePagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  const linkClass =
    "rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:bg-muted";
  const disabledClass =
    "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground/50";

  return (
    <nav
      aria-label="Live feed pagination"
      className="flex items-center justify-between gap-3"
    >
      {page > 1 ? (
        <Link href={pageHref(page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span aria-hidden className={disabledClass}>
          ← Previous
        </span>
      )}

      <span className="tabular text-xs text-muted-foreground">
        page {page} of {totalPages}
      </span>

      {page < totalPages ? (
        <Link href={pageHref(page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span aria-hidden className={disabledClass}>
          Next →
        </span>
      )}
    </nav>
  );
}
