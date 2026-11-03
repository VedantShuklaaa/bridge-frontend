import { headers } from "next/headers";
import { buildJsonLd } from "@/lib/seo";
import { serializeJsonLd } from "@/lib/security";

/**
 * The single exception to the "no dangerouslySetInnerHTML" rule: JSON-LD, with
 * `serializeJsonLd` escaping `<`, `>` and `&`.
 */
export async function JsonLd() {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      type="application/ld+json"
      nonce={nonce}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(buildJsonLd()) }}
    />
  );
}
