"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { DecoFrame } from "@/components/deco/DecoFrame";
import { useOverlay } from "@/hooks/useOverlay";
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
 * whether the file exists. Decorative at rest: alt is empty because the
 * name/title is already on the page. A real file opens a large view.
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
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { overlayRef, contentRef } = useOverlay({
    isOpen: open,
    onClose: () => setOpen(false),
    returnFocus: () => triggerRef.current,
  });
  const slotProp =
    slot === "poster"
      ? { "data-poster-slot": true }
      : slot === "portrait"
        ? { "data-portrait": true }
        : {};
  const viewLabel =
    slot === "poster"
      ? `View poster of ${label}`
      : slot === "portrait"
        ? `View portrait of ${label}`
        : `View image of ${label}`;
  const largeWidth = 480;
  const largeHeight = slot === "portrait" ? 480 : 720;

  const frame = (
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

  if (!src) return frame;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={viewLabel}
        onClick={() => setOpen(true)}
        className="relative shrink-0 cursor-zoom-in border-0 bg-transparent p-0"
      >
        {frame}
      </button>
      {open ? (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/85 p-6"
        >
          <DecoFrame
            ref={contentRef}
            radius="panel"
            variant="flat"
            className="max-h-[90vh] max-w-[min(90vw,32rem)] p-3"
          >
            <Image
              src={src}
              alt=""
              width={largeWidth}
              height={largeHeight}
              className="h-auto max-h-[80vh] w-auto max-w-full object-contain"
            />
          </DecoFrame>
        </div>
      ) : null}
    </>
  );
}
