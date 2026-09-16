import { z } from "zod";
import {
  parseFilmYear,
  resolveCategoryId,
  resolveCategoryLabel,
} from "@/data/categories";
import { ceremonyByFilmYear } from "@/data/ceremonies";
import {
  historicalRecordSchema,
  parseData,
  type HistoricalMovie,
} from "@/lib/schemas";
import type { Movie } from "@/lib/types";

export type NominationRecord = {
  ordinal: number;
  categoryId: string;
  categoryLabel: string;
  names: string[];
  movies: Movie[];
  won: boolean;
};

const historicalFeedSchema = z.array(historicalRecordSchema);

function toMovie(raw: HistoricalMovie): Movie {
  const movie: Movie = { title: raw.title };
  if (raw.tmdb_id != null) movie.tmdbId = raw.tmdb_id;
  if (raw.imdb_id != null) movie.imdbId = raw.imdb_id;
  return movie;
}

/**
 * Canonicalize the historical JSON feed. Pure: no network or disk.
 * Unrecognized categories, orphan years, and schema failures abort.
 */
export function loadHistoricalRecords(rawJson: unknown): NominationRecord[] {
  const sourceRecords = parseData(
    historicalFeedSchema,
    rawJson,
    "historical nominations",
  );

  const unknownCategories = new Map<string, Set<string>>();
  const orphanYears = new Set<string>();
  const records: NominationRecord[] = [];

  for (const source of sourceRecords) {
    const ceremony = ceremonyByFilmYear(source.year);
    if (!ceremony) {
      orphanYears.add(source.year);
      continue;
    }

    const category = resolveCategoryId(source.category);
    if (!category) {
      const years = unknownCategories.get(source.category) ?? new Set();
      years.add(source.year);
      unknownCategories.set(source.category, years);
      continue;
    }

    records.push({
      ordinal: ceremony.ordinal,
      categoryId: category.id,
      categoryLabel: resolveCategoryLabel(
        category.id,
        parseFilmYear(ceremony.filmYearLabel),
      ),
      names: source.nominees,
      movies: source.movies.map(toMovie),
      won: source.won,
    });
  }

  const errors: string[] = [];
  if (unknownCategories.size > 0) {
    const listed = [...unknownCategories.entries()]
      .map(([name, years]) => `${name} (${[...years].join(", ")})`)
      .join("; ");
    errors.push(`Unmapped category names: ${listed}`);
  }
  if (orphanYears.size > 0) {
    errors.push(
      `Year values with no matching ceremony: ${[...orphanYears].join(", ")}`,
    );
  }
  if (errors.length > 0) {
    throw new Error(errors.join("\n"));
  }

  return records;
}
