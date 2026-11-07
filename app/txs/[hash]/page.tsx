import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TxDetail } from "@/components/live/tx-detail";
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
    path: `/txs/${encodeURIComponent(hash)}`,
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

  return <TxDetail key={hash} hash={hash} />;
}
