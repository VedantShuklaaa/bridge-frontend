import type { MetadataRoute } from "next";

// Placeholder: moved onto lib/seo.ts siteConfig in the SEO chunk.
const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
