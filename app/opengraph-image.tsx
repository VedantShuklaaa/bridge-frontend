import { ImageResponse } from "next/og";

export const alt = "bridgeIndexer — Solana bridge transfer search";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a0a0a",
          color: "#fafafa",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          justifyContent: "space-between",
          padding: "72px",
          width: "100%",
        }}
      >
        <div style={{ alignItems: "center", display: "flex", gap: 16 }}>
          <div
            style={{
              background: "#fafafa",
              borderRadius: 999,
              height: 20,
              width: 20,
            }}
          />
          <div style={{ fontSize: 30, letterSpacing: -1 }}>bridgeIndexer</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              fontSize: 76,
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.05,
            }}
          >
            Bridge transfers, indexed.
          </div>
          <div style={{ color: "#a3a3a3", fontSize: 32 }}>
            Search a Solana transaction. Inspect every hop.
          </div>
        </div>

        <div
          style={{
            color: "#737373",
            display: "flex",
            fontSize: 24,
            justifyContent: "space-between",
          }}
        >
          <span>Solana</span>
          <span>Wormhole Token Bridge</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
