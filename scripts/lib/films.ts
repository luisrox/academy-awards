import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { parseFilmYear } from "@/data/categories";
import type { CeremonyDetail, FilmLink } from "@/lib/schemas";
import { filmLinkSchema, parseData } from "@/lib/schemas";
import { isPortraitCategory } from "@/lib/poster";
import { DATA_DIR } from "./cache";

/**
 * The historical feed ships tmdb_id with every film; the Academy scrape used
 * for the newest editions ships titles only. Without an id there is no poster
 * to download and no credit list to verify a portrait against, so titles have
 * to be resolved against TMDB search and the result committed for review.
 */
export type FilmJob = {
  title: string;
  filmYear: number;
  /** Where the title came from, for the log line and for provenBy. */
  slug: string;
};

export type FilmCandidate = {
  id: number;
  title: string;
  original_title?: string;
  release_date?: string;
  vote_count?: number;
};

/** Enough detail to settle an ambiguity from the log, without a second lookup. */
export function describeCandidate(film: FilmCandidate): string {
  const parts = [`TMDB ${film.id}`, film.title];
  if (film.original_title !== undefined && film.original_title !== film.title) {
    parts.push(`orig. ${film.original_title}`);
  }
  parts.push(film.release_date ?? "no release date");
  if (film.vote_count !== undefined) parts.push(`${film.vote_count} votes`);
  return parts.join(", ");
}

export type FilmMatch =
  | { status: "none"; matches: FilmCandidate[] }
  | { status: "one"; matches: [FilmCandidate] }
  | { status: "many"; matches: FilmCandidate[] };

export function filmKey(title: string, filmYear: number): string {
  return `${title}\u0000${filmYear}`;
}

export function loadFilms(dataDir = DATA_DIR): FilmLink[] {
  const file = path.join(dataDir, "films.json");
  if (!existsSync(file)) return [];
  return parseData(
    z.array(filmLinkSchema),
    JSON.parse(readFileSync(file, "utf8")) as unknown,
    "films.json",
  );
}

/**
 * The titles worth an id: the Best Picture winner (its poster fronts the
 * ceremony) and the films that directing and acting winners won for (their
 * credits prove the portrait). Everything already carrying an id is skipped.
 */
export function collectFilmJobs(details: CeremonyDetail[]): FilmJob[] {
  const seen = new Set<string>();
  const jobs: FilmJob[] = [];
  for (const detail of details) {
    const filmYear = parseFilmYear(detail.ceremony.filmYearLabel);
    for (const group of detail.groups) {
      for (const category of group.categories) {
        if (category.id !== "best-picture" && !isPortraitCategory(category.id)) {
          continue;
        }
        for (const winner of category.winners) {
          const movie = winner.movies[0];
          if (!movie || movie.tmdbId != null) continue;
          const key = filmKey(movie.title, filmYear);
          if (seen.has(key)) continue;
          seen.add(key);
          jobs.push({
            title: movie.title,
            filmYear,
            slug: detail.ceremony.slug,
          });
        }
      }
    }
  }
  return jobs;
}

/**
 * Fold away case, accents and punctuation so "Emilia Pérez" matches "Emilia
 * Perez". Apostrophes are dropped rather than treated as separators, so "I'm"
 * does not become two words.
 */
export function normalizeTitle(title: string): string {
  return title
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/**
 * Keep only hits whose title matches what the Academy printed and whose
 * release year is the film year or the one after it (a late-December release
 * can carry the next year's date on TMDB). Zero hits → no id. Several → manual.
 */
export function pickFilmMatch(
  searchResults: FilmCandidate[],
  title: string,
  filmYear: number,
): FilmMatch {
  const wanted = normalizeTitle(title);
  const matches = searchResults.filter((film) => {
    const titleMatches =
      normalizeTitle(film.title) === wanted ||
      (film.original_title !== undefined &&
        normalizeTitle(film.original_title) === wanted);
    if (!titleMatches) return false;
    const released = Number(film.release_date?.slice(0, 4));
    if (!Number.isInteger(released)) return false;
    return released === filmYear || released === filmYear + 1;
  });
  if (matches.length === 0) return { status: "none", matches: [] };
  if (matches.length === 1) return { status: "one", matches: [matches[0]] };
  return { status: "many", matches };
}

export function mergeFilms(
  existing: FilmLink[],
  discovered: FilmLink[],
): FilmLink[] {
  const byKey = new Map<string, FilmLink>();
  for (const link of discovered) byKey.set(filmKey(link.title, link.filmYear), link);
  for (const link of existing) byKey.set(filmKey(link.title, link.filmYear), link);
  return [...byKey.values()].sort(
    (a, b) => a.filmYear - b.filmYear || a.title.localeCompare(b.title),
  );
}

export function filmMappingErrors(films: FilmLink[]): string[] {
  const errors: string[] = [];
  const idsByKey = new Map<string, Set<number | null>>();
  for (const link of films) {
    const key = filmKey(link.title, link.filmYear);
    const ids = idsByKey.get(key) ?? new Set();
    ids.add(link.tmdbId);
    idsByKey.set(key, ids);
  }
  for (const [key, ids] of idsByKey) {
    if (ids.size > 1) {
      const [title, filmYear] = key.split("\u0000");
      errors.push(
        `films.json maps "${title}" (${filmYear}) to more than one TMDB id: ${[...ids].join(", ")}`,
      );
    }
  }
  return errors;
}

/**
 * Fill in ids the sources omitted. Never overwrites an id that is already
 * there: the historical feed stays authoritative for its own editions.
 */
export function attachFilmIds(
  details: CeremonyDetail[],
  films: FilmLink[],
): CeremonyDetail[] {
  const byKey = new Map(
    films.map((link) => [filmKey(link.title, link.filmYear), link]),
  );
  for (const detail of details) {
    const filmYear = parseFilmYear(detail.ceremony.filmYearLabel);
    for (const group of detail.groups) {
      for (const category of group.categories) {
        for (const row of [...category.winners, ...category.nominees]) {
          for (const movie of row.movies) {
            if (movie.tmdbId != null) continue;
            const link = byKey.get(filmKey(movie.title, filmYear));
            if (link?.tmdbId == null) continue;
            movie.tmdbId = link.tmdbId;
          }
        }
      }
    }
  }
  return details;
}

const TMDB_SEARCH = "https://api.themoviedb.org/3/search/movie";

export async function discoverFilms(
  jobs: FilmJob[],
  existing: FilmLink[],
  deps: {
    apiKey: string;
    fetchFn: typeof fetch;
    log?: (message: string) => void;
  },
): Promise<FilmLink[]> {
  const known = new Set(
    existing.map((link) => filmKey(link.title, link.filmYear)),
  );
  const discovered: FilmLink[] = [];
  const log = deps.log ?? console.log;

  for (const job of jobs) {
    if (known.has(filmKey(job.title, job.filmYear))) continue;
    try {
      const url = `${TMDB_SEARCH}?api_key=${deps.apiKey}&query=${encodeURIComponent(
        job.title,
      )}&primary_release_year=${job.filmYear}`;
      const response = await deps.fetchFn(url);
      if (!response.ok) {
        throw new Error(`search failed: ${response.status}`);
      }
      const body = (await response.json()) as { results?: FilmCandidate[] };
      const match = pickFilmMatch(body.results ?? [], job.title, job.filmYear);
      if (match.status === "many") {
        log(
          `Ambiguous film "${job.title}" (${job.filmYear}, ${job.slug}): ${match.matches
            .map((film) => `[${describeCandidate(film)}]`)
            .join(" ")}. Resolve manually in data/films.json.`,
        );
        continue;
      }
      if (match.status === "none") {
        log(
          `No TMDB match for "${job.title}" (${job.filmYear}, ${job.slug}); recorded without an id.`,
        );
        discovered.push({
          title: job.title,
          filmYear: job.filmYear,
          tmdbId: null,
          provenBy: `search ${job.filmYear}`,
        });
        continue;
      }
      const film = match.matches[0];
      discovered.push({
        title: job.title,
        filmYear: job.filmYear,
        tmdbId: film.id,
        provenBy: `${film.title} (${film.release_date ?? "?"})`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to resolve film "${job.title}" (${job.filmYear}): ${message}`);
    }
  }

  return discovered;
}
