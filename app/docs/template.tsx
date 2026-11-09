import type { ReactNode } from "react";
import { DocsTransition } from "@/components/docs/transition";

export default function Template({ children }: { children: ReactNode }) {
	return <DocsTransition>{children}</DocsTransition>;
}
