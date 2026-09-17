import { POSTER_HEIGHT, POSTER_WIDTH } from "@/lib/poster";
import type { Movie } from "@/lib/types";
import { ImageMonogram } from "./ImageMonogram";

type PosterSlotProps = {
  movie?: Movie;
};

/** Overlay Best Picture art: 144×216, inner radius, gold edge. */
export function PosterSlot({ movie }: PosterSlotProps) {
  return (
    <ImageMonogram
      slot="poster"
      src={movie?.posterPath}
      label={movie?.title ?? ""}
      width={POSTER_WIDTH}
      height={POSTER_HEIGHT}
    />
  );
}
