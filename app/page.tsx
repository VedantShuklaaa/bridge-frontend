import type { Metadata } from "next";
import { HomeView } from "@/components/home/home-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Transaction search",
  description:
    "Search a Solana transaction and inspect every bridge transfer it contains.",
  path: "/",
});

export default function HomePage() {
  return <HomeView />;
}
