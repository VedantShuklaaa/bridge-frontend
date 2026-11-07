import type { Metadata } from "next";
import { TxsView } from "@/components/txs/txs-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Transactions",
  description:
    "Search a Solana transaction and watch bridge transfers as they are indexed.",
  path: "/txs",
  // The feed is live and the same URL pages through it; keep it out of search.
  noindex: true,
});

type TxsPageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TxsPage({ searchParams }: TxsPageProps) {
  const { page } = await searchParams;

  return <TxsView pageParam={firstValue(page)} />;
}
