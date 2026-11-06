"use client";

export function DetailFallback({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-6 sm:p-8">
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:bg-muted"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}
