import type { Metadata } from "next";
import { LiveView } from "@/components/live/live-view";
import { buildMetadata } from "@/lib/seo";

export const metadata: Metadata = buildMetadata({
  title: "Live feed",
  description: "Watch bridge transfers as they are indexed.",
  path: "/live",
  noindex: true,
});

export default function LivePage() {
  return <LiveView />;
}
