import { ImageResponse } from "next/og";
import { EmblemGraphic } from "@/components/deco/Emblem";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0A0908",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="28" height="28" viewBox="0 0 64 64">
          <EmblemGraphic color="#C9A227" />
        </svg>
      </div>
    ),
    { ...size },
  );
}