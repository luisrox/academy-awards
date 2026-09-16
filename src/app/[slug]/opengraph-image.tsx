import { ImageResponse } from "next/og";
import {
  ambiguousYearRedirect,
  ceremonyBySlug,
  ordinalSuffix,
} from "@/data/ceremonies";

export const alt = "Oscars Winners";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ceremony = ceremonyBySlug(ambiguousYearRedirect(slug) ?? slug);
  const year = ceremony?.ceremonyYear ?? slug;
  const edition = ceremony
    ? `${ordinalSuffix(ceremony.ordinal)} Academy Awards`
    : "";

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
        <div
          style={{
            fontSize: 24,
            letterSpacing: 8,
            color: "#B8A990",
          }}
        >
          OSCARS WINNERS
        </div>
        <div style={{ fontSize: 96, marginTop: 24 }}>{String(year)}</div>
        <div style={{ fontSize: 36, color: "#E8C96A", marginTop: 16 }}>
          {edition}
        </div>
      </div>
    ),
    { ...size },
  );
}
