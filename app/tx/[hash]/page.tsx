import { notFound } from "next/navigation";
import { TxView } from "@/components/tx/tx-view";
import { isValidSolanaSignature } from "@/lib/security";

export default async function TransactionPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = await params;

  if (!isValidSolanaSignature(hash)) {
    notFound();
  }

  return <TxView hash={hash} />;
}
