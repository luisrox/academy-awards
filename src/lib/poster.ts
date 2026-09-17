import type { CeremonyDetail, Movie } from "./types";

/** Display size of the overlay Best Picture poster (2:3, spec.md 8.7). */
export const POSTER_WIDTH = 144;
export const POSTER_HEIGHT = 216;

/** Square winner portrait next to the name (spec.md 8.7). */
export const PORTRAIT_SIZE = 56;

export const PORTRAIT_CATEGORY_IDS = [
  "best-director",
  "best-actor",
  "best-actress",
  "best-supporting-actor",
  "best-supporting-actress",
] as const;

export type PortraitCategoryId = (typeof PORTRAIT_CATEGORY_IDS)[number];

export function isPortraitCategory(id: string): id is PortraitCategoryId {
  return (PORTRAIT_CATEGORY_IDS as readonly string[]).includes(id);
}

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
 * Typographic monogram for a missing image (spec.md 8.7 / 10.3).
 * One or two letters from the title or person name.
 */
export function pictureMonogram(label: string): string {
  const words = label
    .split(/[\s/:]+/)
    .map((word) => word.replace(/[^A-Za-z0-9À-ÿ]/g, ""))
    .filter((word) => word.length > 0)
    .filter((word) => !/^(the|a|an|of|and|la|le|el)$/i.test(word));
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
  }
  const single = words[0] ?? label.replace(/\s+/g, "");
  const letters = single.slice(0, 2).toUpperCase();
  return letters || "—";
}

/** @deprecated Use pictureMonogram — same fallback for posters and portraits. */
export const posterMonogram = pictureMonogram;
