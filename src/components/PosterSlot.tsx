import Image from "next/image";
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  posterMonogram,
} from "@/lib/poster";
import type { Movie } from "@/lib/types";

type PosterSlotProps = {
  movie?: Movie;
};

/**
 * Overlay Best Picture art: 144×216, inner radius, gold edge.
 * Missing files (97th/98th, failed downloads) keep the same box.
 */
export function PosterSlot({ movie }: PosterSlotProps) {
  const title = movie?.title ?? "";
  return (
    <div
      data-poster-slot
      aria-hidden="true"
      className="relative shrink-0 overflow-hidden border border-gold bg-surface"
      style={{
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: "var(--radius-inner)",
      }}
    >
      {movie?.posterPath ? (
        <Image
          src={movie.posterPath}
          alt=""
          width={POSTER_WIDTH}
          height={POSTER_HEIGHT}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center px-3 text-center">
          <p className="font-display text-3xl tracking-wide text-gold">
            {posterMonogram(title)}
          </p>
          {title ? (
            <p className="mt-2 font-display text-[0.65rem] leading-snug text-muted">
              {title}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
