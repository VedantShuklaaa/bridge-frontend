import { ImageResponse } from "next/og";

export const alt = "bridgeIndexer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Placeholder: the branded image is finished in the SEO chunk.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <div style={{ fontSize: 72, fontWeight: 600 }}>bridgeIndexer</div>
        <div style={{ color: "#a3a3a3", fontSize: 30, marginTop: 24 }}>
          Solana bridge transfers
        </div>
      </div>
    ),
    { ...size },
  );
}
