import { siteConfig } from "@/lib/seo";

/**
 * Site identity for routes that build their own metadata and JSON-LD.
 *
 * `SITE_URL` is the origin only. The app is served under `SITE_BASE_PATH`
 * (see `basePath` in `next.config.ts`), so canonical URLs need the prefix
 * even though `<Link href="/...">` adds it automatically.
 */
export const SITE_NAME = siteConfig.name;
export const SITE_DESCRIPTION = siteConfig.description;
export const SITE_URL = siteConfig.url;
export const SITE_BASE_PATH = "/hermit";
export const AUTHOR = "Vedant Shukla";

/** Builds an absolute URL for a route path, including the app base path. */
export function absoluteUrl(path: string): string {
	const clean = path.startsWith("/") ? path : `/${path}`;
	const withBase =
		clean === SITE_BASE_PATH || clean.startsWith(`${SITE_BASE_PATH}/`)
			? clean
			: `${SITE_BASE_PATH}${clean}`;

	return new URL(withBase, `${SITE_URL}/`).toString();
}
