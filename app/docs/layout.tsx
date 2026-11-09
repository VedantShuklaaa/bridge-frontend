import type { Metadata } from "next";
import { Shell } from "@/components/docs/shell";
import { navGroups } from "@/lib/docs";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
	title: {
		default: `${SITE_NAME} docs`,
		template: `%s | ${SITE_NAME} docs`,
	},
	description: SITE_DESCRIPTION,
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
	return <Shell groups={navGroups}>{children}</Shell>;
}
