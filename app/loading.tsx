export default function Loading() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className="mx-auto max-w-3xl px-4 py-12"
    >
      <div className="h-8 w-48 animate-pulse rounded-md bg-muted motion-reduce:animate-none" />
      <div className="mt-6 space-y-3">
        <div className="h-16 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
        <div className="h-16 animate-pulse rounded-lg bg-muted motion-reduce:animate-none" />
      </div>
    </div>
  );
}
