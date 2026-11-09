import { permanentRedirect } from "next/navigation";

export default function DocsIndex() {
	permanentRedirect("/docs/overview");
}
