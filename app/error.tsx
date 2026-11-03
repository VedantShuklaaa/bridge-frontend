"use client";

import { ErrorView } from "@/components/layout/error-view";

export default function RouteError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  return <ErrorView error={error} retry={retry} />;
}
