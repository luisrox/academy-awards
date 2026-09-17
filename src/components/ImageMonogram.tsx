import Image from "next/image";
import { pictureMonogram } from "@/lib/poster";

type ImageMonogramProps = {
  src?: string;
  label: string;
  width: number;
  height: number;
  objectPosition?: "center" | "top";
  priority?: boolean;
  slot?: "poster" | "portrait";
};

/**
 * Shared image-or-monogram box (spec.md 8.7). Same radius and gold edge
 * whether the file exists. Decorative: alt is empty because the name/title
 * is already on the page.
 */
export function ImageMonogram({
  src,
  label,
  width,
  height,
  objectPosition = "center",
  priority = false,
  slot,
}: ImageMonogramProps) {
  const slotProp =
    slot === "poster"
      ? { "data-poster-slot": true }
      : slot === "portrait"
        ? { "data-portrait": true }
        : {};
  return (
    <div
      {...slotProp}
      aria-hidden="true"
      data-image-fallback={src ? "image" : "monogram"}
      className="relative shrink-0 overflow-hidden border border-gold bg-surface"
      style={{
        width,
        height,
        borderRadius: "var(--radius-inner)",
      }}
    >
      {src ? (
        <Image
          src={src}
          alt=""
          width={width}
          height={height}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className={`h-full w-full object-cover ${objectPosition === "top" ? "object-top" : ""}`}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center px-1 text-center">
          <p
            className={`font-display tracking-wide text-gold ${height >= 120 ? "text-3xl" : "text-sm"}`}
          >
            {pictureMonogram(label)}
          </p>
        </div>
      )}
    </div>
  );
}
