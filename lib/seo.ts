import type { Metadata } from "next";
import { publicConfig } from "@/lib/config.public";

export const siteConfig = {
  name: "bridgeIndexer",
  description:
    "Search a Solana transaction and inspect every bridge transfer it contains.",
  url: publicConfig.siteUrl,
} as const;

type BuildMetadataArgs = {
  title: string;
  description: string;
  path: string;
  noindex?: boolean;
};

export function buildMetadata({
  title,
  description,
  path,
  noindex = false,
}: BuildMetadataArgs): Metadata {
  const url = new URL(path, `${siteConfig.url}/`).toString();

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      siteName: siteConfig.name,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function shortenHash(hash: string, head = 8, tail = 8): string {
  if (hash.length <= head + tail + 1) {
    return hash;
  }

  return `${hash.slice(0, head)}…${hash.slice(-tail)}`;
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/txs/{transaction_hash}`,
    },
  };
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "Web",
  };
}

export function buildJsonLd() {
  return [websiteJsonLd(), webApplicationJsonLd()];
}
