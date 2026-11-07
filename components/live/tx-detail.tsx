"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useNow } from "@/hooks/use-now";
import { fetchAnalysis } from "@/lib/api/client";
import { ApiError } from "@/lib/api/errors";
import type { TransactionResponse } from "@/lib/api/schemas";
import { detailFromEntry, detailFromResponse } from "@/lib/detail";
import { shortHash } from "@/lib/format";
import { findLiveEntry } from "@/lib/live-store";
import { DetailContent } from "./detail-content";
import { DetailFallback } from "./detail-fallback";
import { useLive } from "./live-provider";

type RequestState = {
  attempt: number;
  phase: "not_found" | "error";
  message: string | null;
};

type FetchedState = {
  attempt: number;
  response: TransactionResponse;
};

export function TxDetail({ hash }: { hash: string }) {
  const router = useRouter();
  const { getByHash } = useLive();
  const entry = getByHash(hash);

  const [attempt, setAttempt] = useState(0);
  const [request, setRequest] = useState<RequestState | null>(null);
  const [fetched, setFetched] = useState<FetchedState | null>(null);
  const now = useNow();

  useEffect(() => {
    // The feed may already hold this hash; the extra lookup avoids a redundant
    // request while the global snapshot is still arriving.
    if (entry || findLiveEntry(hash)) {
      return;
    }

    const controller = new AbortController();

    fetchAnalysis(hash, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setFetched({ attempt, response });
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }

        if (error instanceof ApiError && error.kind === "not_found") {
          setRequest({ attempt, phase: "not_found", message: null });
          return;
        }

        setRequest({
          attempt,
          phase: "error",
          message:
            error instanceof Error
              ? error.message
              : "Could not load this transaction.",
        });
      });

    return () => controller.abort();
  }, [attempt, entry, hash]);

  const fetchedResponse =
    fetched !== null && fetched.attempt === attempt ? fetched.response : null;
  const detail = entry
    ? detailFromEntry(entry)
    : fetchedResponse
      ? detailFromResponse(fetchedResponse)
      : null;
  const current = request !== null && request.attempt === attempt ? request : null;

  function goBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/txs");
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-28 pb-12">
      <div className="mb-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="rounded-md border border-border px-3 py-1.5 text-sm transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring motion-safe:active:bg-muted"
        >
          ← Back to transactions
        </button>
        <span className="font-mono text-xs text-muted-foreground">
          {shortHash(hash, 6, 6)}
        </span>
      </div>

      {detail ? (
        <DetailContent detail={detail} now={now} />
      ) : current?.phase === "not_found" ? (
        <DetailFallback
          title="Transaction not found"
          description={`No indexed transaction matches ${shortHash(hash, 8, 8)}.`}
        />
      ) : current?.phase === "error" ? (
        <DetailFallback
          title="Could not load transaction"
          description={current.message ?? "The indexer did not respond."}
          onRetry={() => setAttempt((value) => value + 1)}
        />
      ) : (
        <DetailFallback
          title="Loading transaction…"
          description="Reading the indexer for this transaction."
        />
      )}
    </div>
  );
}
