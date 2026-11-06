import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TxDetail } from "@/components/live/tx-detail";
import { isValidSolanaSignature } from "@/lib/security";
import { buildMetadata, shortenHash } from "@/lib/seo";

type TxDetailPageProps = {
  params: Promise<{ hash: string }>;
};

export async function generateMetadata({
  params,
}: TxDetailPageProps): Promise<Metadata> {
  const { hash } = await params;
  const short = shortenHash(hash);

  return buildMetadata({
    title: `Live transfer ${short}`,
    description: `Bridge transfer dashboard for Solana transaction ${short}.`,
    path: `/live/${encodeURIComponent(hash)}`,
    noindex: true,
  });
}

export default async function LiveTransactionPage({
  params,
}: TxDetailPageProps) {
  const { hash } = await params;

  if (!isValidSolanaSignature(hash)) {
    notFound();
  }

  return <TxDetail key={hash} hash={hash} />;
}
