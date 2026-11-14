import Link from "next/link";

function pageHref(page: number): string {
  return page <= 1 ? "/txs" : `/txs?page=${page}`;
}

export function TxsPagination({
  page,
  totalPages,
  hasMore = false,
}: {
  page: number;
  /** Pages already loaded; the cursor may still hold older rows. */
  totalPages: number;
  hasMore?: boolean;
}) {
  const linkClass =
    "rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:bg-muted";
  const disabledClass =
    "rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground/50";
  const canGoNext = page < totalPages || hasMore;

  return (
    <nav
      aria-label="Transaction feed pagination"
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
        {hasMore ? "+" : ""}
      </span>

      {canGoNext ? (
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
