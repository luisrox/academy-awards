import { ImageResponse } from "next/og";
import { EmblemGraphic } from "@/components/deco/Emblem";

export const alt = "Oscars Winners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0908",
          color: "#C9A227",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
        }}
      >
        <svg width="96" height="96" viewBox="0 0 64 64">
          <EmblemGraphic color="#C9A227" />
        </svg>
        <div
          style={{
            fontSize: 24,
            letterSpacing: 8,
            color: "#B8A990",
            marginTop: 32,
          }}
        >
          OSCARS WINNERS
        </div>
        <div style={{ fontSize: 56, marginTop: 16 }}>
          Every Academy Awards ceremony
        </div>
      </div>
    ),
    { ...size },
  );
}