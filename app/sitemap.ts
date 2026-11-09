import type { MetadataRoute } from "next";
import { sections } from "@/lib/docs";
import { absoluteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      changeFrequency: "weekly",
      priority: 1,
    },
    ...sections.map((section) => ({
      url: absoluteUrl(`/docs/${section.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
