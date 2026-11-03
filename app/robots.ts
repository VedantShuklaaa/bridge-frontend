import type { MetadataRoute } from "next";

// Placeholder: expanded with disallow rules and the sitemap in the SEO chunk.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
  };
}
