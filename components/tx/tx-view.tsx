import type { ReactNode } from "react";
import { fetchAnalysis } from "@/lib/api/client";
import { ApiError, type ApiErrorKind } from "@/lib/api/errors";
import type {
  TransactionResponse,
  TransferView,
} from "@/lib/api/schemas";
import { safeExternalUrl } from "@/lib/security";
import { shortenAddress } from "@/lib/utils";

/**
 * TODO(design): temporary flat details view. It renders the real v2 payload
 * only; the full-page loading transition and final transfer layout land later.
 */
export async function TxView({ hash }: { hash: string }) {
  let result:
    | { ok: true; data: TransactionResponse }
    | { ok: false; kind: ApiErrorKind };

  try {
    result = { ok: true, data: await fetchAnalysis(hash) };
  } catch (error) {
    result = {
      ok: false,
      kind: error instanceof ApiError ? error.kind : "bad_response",
    };
  }

  if (!result.ok) {
    return <TxErrorView hash={hash} kind={result.kind} />;
  }

  const transaction = result.data;
  const transferCount = transaction.transfers.length;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl">Transaction</h1>
        <p className="break-all font-mono text-xs text-muted-foreground">
          {hash}
        </p>
      </header>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="text-muted-foreground">Status</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-xs">
          {transaction.status}
        </span>
        <span className="text-muted-foreground">
          {transferCount === 1 ? "1 bridge transfer" : `${transferCount} bridge transfers`}
        </span>
      </div>

      <h2 className="mt-8 text-sm font-medium text-muted-foreground">
        Transfers
      </h2>

      {transferCount === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This transaction has no indexed bridge transfers.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {transaction.transfers.map((transfer) => (
            <TransferRow
              key={`${transfer.observed_tx_hash}-${transfer.event_index}`}
              transfer={transfer}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

const ERROR_COPY: Record<ApiErrorKind, { title: string; body: string }> = {
  invalid_input: {
    title: "Invalid signature",
    body: "That transaction signature is not valid. Solana signatures are 86 to 88 base58 characters.",
  },
  not_found: {
    title: "Transaction not found",
    body: "The indexer has no record of this signature yet. It may not have been indexed; try again shortly.",
  },
  rate_limited: {
    title: "Too many requests",
    body: "The indexer is rate limiting requests. Wait a moment, then try again.",
  },
  unavailable: {
    title: "Indexer unavailable",
    body: "The indexer is temporarily unavailable or overloaded. Try again shortly.",
  },
  misconfigured: {
    title: "Indexer misconfigured",
    body: "The indexer answered, but its analyse route does not exist. This is a server configuration problem, not a missing transaction.",
  },
  timeout: {
    title: "Request timed out",
    body: "The indexer took too long to respond. Try again in a moment.",
  },
  network: {
    title: "Network error",
    body: "The request could not reach the indexer. Check your connection and try again.",
  },
  bad_response: {
    title: "Unexpected response",
    body: "The indexer returned a response this app could not read. Try again later.",
  },
};

function TxErrorView({ hash, kind }: { hash: string; kind: ApiErrorKind }) {
  const copy = ERROR_COPY[kind];

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="text-2xl sm:text-3xl">{copy.title}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">{copy.body}</p>
      <p className="mt-6 break-all font-mono text-xs text-muted-foreground">
        {hash}
      </p>
    </section>
  );
}

function TransferRow({ transfer }: { transfer: TransferView }) {
  const sourceExplorer = safeExternalUrl(transfer.source_explorer_url);
  const destinationExplorer = safeExternalUrl(
    transfer.destination_explorer_url,
  );

  return (
    <li className="rounded-lg border border-border px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <span className="font-medium">{transfer.protocol}</span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <span>{transfer.direction}</span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <span>{chainLabel(transfer.source)}</span>
        <span aria-hidden className="text-muted-foreground">
          →
        </span>
        <span>{chainLabel(transfer.destination)}</span>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="tabular font-mono">{amountLabel(transfer)}</span>
        <span className="rounded-full border border-border px-2 py-0.5 text-foreground">
          {transfer.status}
        </span>
        {sourceExplorer ? (
          <ExternalLink href={sourceExplorer}>Source explorer</ExternalLink>
        ) : null}
        {destinationExplorer ? (
          <ExternalLink href={destinationExplorer}>
            Destination explorer
          </ExternalLink>
        ) : null}
      </div>
    </li>
  );
}

function chainLabel(chain: TransferView["source"]): string {
  return chain.chain ? chain.chain.name : `${chain.protocol} · ${chain.id}`;
}

function amountLabel(transfer: TransferView): string {
  const amount = transfer.amount_formatted ?? "Amount unknown";

  if (transfer.token_symbol) {
    return `${amount} ${transfer.token_symbol}`;
  }

  const tokenAddress = transfer.token?.address;
  return tokenAddress ? `${amount} ${shortenAddress(tokenAddress)}` : amount;
}

function ExternalLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="underline underline-offset-4 hover:text-foreground"
    >
      {children}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
