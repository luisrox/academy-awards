import type { CeremonyDetail, Movie } from "./types";

/** Display size of the overlay Best Picture poster (2:3, spec.md 4.5 / 7.4). */
export const POSTER_WIDTH = 144;
export const POSTER_HEIGHT = 216;

export function bestPictureMovie(detail: CeremonyDetail): Movie | undefined {
  for (const group of detail.groups) {
    for (const category of group.categories) {
      if (category.id === "best-picture") {
        return category.winners[0]?.movies[0];
      }
    }
  }
  return undefined;
}

/**
 * Typographic monogram for a missing poster (spec.md 10.3).
 * Initials from the title so the fallback box is never empty.
 */
export function posterMonogram(title: string): string {
  const words = title
    .split(/[\s/:]+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
    .filter((word) => word.length > 0)
    .filter((word) => !/^(the|a|an|of|and|la|le|el)$/i.test(word));
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  const single = words[0] ?? title.replace(/\s+/g, "");
  const letters = single.slice(0, 2).toUpperCase();
  return letters || "—";
}
