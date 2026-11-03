import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TxView } from "@/components/tx/tx-view";
import { isValidSolanaSignature } from "@/lib/security";
import { buildMetadata, shortenHash } from "@/lib/seo";

type TransactionPageProps = {
  params: Promise<{ hash: string }>;
};

export async function generateMetadata({
  params,
}: TransactionPageProps): Promise<Metadata> {
  const { hash } = await params;
  const short = shortenHash(hash);

  return buildMetadata({
    title: `Transaction ${short}`,
    description: `Bridge transfers for Solana transaction ${short}.`,
    path: `/tx/${encodeURIComponent(hash)}`,
    // TODO(design): index once the page renders the real transfer data.
    noindex: true,
  });
}

export default async function TransactionPage({
  params,
}: TransactionPageProps) {
  const { hash } = await params;

  if (!isValidSolanaSignature(hash)) {
    notFound();
  }

  return <TxView hash={hash} />;
}
