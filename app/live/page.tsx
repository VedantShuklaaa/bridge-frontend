import type { Metadata } from "next";
import { LiveView } from "@/components/live/live-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Live feed",
  description: "Watch bridge transfers as they are indexed.",
  path: "/live",
  noindex: true,
});

type LivePageProps = {
  searchParams: Promise<{ page?: string | string[] }>;
};

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LivePage({ searchParams }: LivePageProps) {
  const { page } = await searchParams;

  return <LiveView pageParam={firstValue(page)} />;
}
