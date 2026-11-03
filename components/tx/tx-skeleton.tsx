export function TxSkeleton() {
  return (
    <section
      aria-busy="true"
      className="mx-auto w-full max-w-3xl px-4 py-12"
    >
      <span className="sr-only">Loading transaction…</span>

      <div
        aria-hidden
        className="h-8 w-48 animate-pulse rounded-md bg-muted motion-reduce:animate-none"
      />
      <div
        aria-hidden
        className="mt-3 h-4 w-full max-w-md animate-pulse rounded bg-muted motion-reduce:animate-none"
      />
      <div
        aria-hidden
        className="mt-8 h-4 w-24 animate-pulse rounded bg-muted motion-reduce:animate-none"
      />

      <div aria-hidden className="mt-3 flex flex-col gap-2">
        {[0, 1, 2].map((row) => (
          <div
            key={row}
            className="h-20 rounded-lg border border-border bg-muted/30"
          />
        ))}
      </div>
    </section>
  );
}
