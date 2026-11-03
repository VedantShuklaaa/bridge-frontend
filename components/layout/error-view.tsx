"use client";

import { useEffect } from "react";

type ErrorViewProps = {
  error: unknown;
  retry: () => void;
};

export function ErrorView({ error, retry }: ErrorViewProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16">
      <h1 className="text-3xl">Something went wrong</h1>
      <p className="text-muted-foreground">
        An unexpected error interrupted this page. Try again, or go back to
        search.
      </p>
      <button
        type="button"
        onClick={() => retry()}
        className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Try again
      </button>
    </section>
  );
}
