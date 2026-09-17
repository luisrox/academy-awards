import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { CeremonyDetail, PersonLink } from "@/lib/schemas";
import { parseData, personLinkSchema } from "@/lib/schemas";
import { isPortraitCategory } from "@/lib/poster";
import { DATA_DIR } from "./cache";

export type PersonCandidate = { id: number; name: string };

export type CreditMatch =
  | { status: "none"; matches: PersonCandidate[] }
  | { status: "one"; matches: [PersonCandidate] }
  | { status: "many"; matches: PersonCandidate[] };

export type PortraitJob = {
  name: string;
  movieTitle: string;
  movieTmdbId: number;
};

export function portraitFileName(tmdbId: number): string {
  return `${tmdbId}.webp`;
}

export function portraitWebPath(tmdbId: number): string {
  return `/images/people/${portraitFileName(tmdbId)}`;
}

export function loadPeople(dataDir = DATA_DIR): PersonLink[] {
  const file = path.join(dataDir, "people.json");
  if (!existsSync(file)) return [];
  return parseData(
    z.array(personLinkSchema),
    JSON.parse(readFileSync(file, "utf8")) as unknown,
    "people.json",
  );
}

export function collectPortraitJobs(details: CeremonyDetail[]): PortraitJob[] {
  const seen = new Set<string>();
  const jobs: PortraitJob[] = [];
  for (const detail of details) {
    for (const group of detail.groups) {
      for (const category of group.categories) {
        if (!isPortraitCategory(category.id)) continue;
        for (const winner of category.winners) {
          const movie = winner.movies[0];
          if (movie?.tmdbId == null) continue;
          for (const name of winner.names) {
            if (!name || seen.has(name)) continue;
            seen.add(name);
            jobs.push({
              name,
              movieTitle: movie.title,
              movieTmdbId: movie.tmdbId,
            });
          }
        }
      }
    }
  }
  return jobs;
}

export function creditedPersonIds(credits: {
  cast?: { id: number }[];
  crew?: { id: number }[];
}): Set<number> {
  const ids = new Set<number>();
  for (const row of [...(credits.cast ?? []), ...(credits.crew ?? [])]) {
    ids.add(row.id);
  }
  return ids;
}

/**
 * Keep only search hits that appear in the winning film's credits.
 * Zero matches → no id. Several matches → manual resolution.
 */
export function pickCreditMatch(
  searchResults: PersonCandidate[],
  creditedIds: Set<number>,
): CreditMatch {
  const matches = searchResults.filter((person) => creditedIds.has(person.id));
  if (matches.length === 0) return { status: "none", matches: [] };
  if (matches.length === 1) return { status: "one", matches: [matches[0]] };
  return { status: "many", matches };
}

export function mergePeople(
  existing: PersonLink[],
  discovered: PersonLink[],
): PersonLink[] {
  const byName = new Map<string, PersonLink>();
  for (const link of discovered) byName.set(link.name, link);
  for (const link of existing) byName.set(link.name, link);
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * A name must resolve to exactly one id, and an id to exactly one canonical
 * name. Sources do spell one person two ways ("Alejandro G." vs "Alejandro
 * Gonzalez"), so a second row may share an id only by declaring `aliasOf`:
 * an undeclared collision still means the disambiguation picked one id for two
 * different people.
 */
export function peopleMappingErrors(people: PersonLink[]): string[] {
  const errors: string[] = [];
  const byName = new Map<string, PersonLink>();
  const idsByName = new Map<string, Set<number | null>>();
  const rowsById = new Map<number, PersonLink[]>();
  for (const link of people) {
    byName.set(link.name, link);
    const ids = idsByName.get(link.name) ?? new Set();
    ids.add(link.tmdbId);
    idsByName.set(link.name, ids);
    if (link.tmdbId == null) continue;
    const rows = rowsById.get(link.tmdbId) ?? [];
    rows.push(link);
    rowsById.set(link.tmdbId, rows);
  }
  for (const [name, ids] of idsByName) {
    if (ids.size > 1) {
      errors.push(
        `people.json maps "${name}" to more than one TMDB id: ${[...ids].join(", ")}`,
      );
    }
  }
  for (const link of people) {
    if (link.aliasOf === undefined) continue;
    const target = byName.get(link.aliasOf);
    if (!target) {
      errors.push(
        `people.json calls "${link.name}" an alias of "${link.aliasOf}", which it does not list`,
      );
    } else if (target.tmdbId !== link.tmdbId) {
      errors.push(
        `people.json calls "${link.name}" an alias of "${link.aliasOf}" but gives them different TMDB ids`,
      );
    } else if (target.aliasOf !== undefined) {
      errors.push(
        `people.json chains aliases: "${link.name}" points at "${link.aliasOf}", itself an alias`,
      );
    }
  }
  for (const [id, rows] of rowsById) {
    const canonical = rows.filter((row) => row.aliasOf === undefined);
    if (canonical.length > 1) {
      errors.push(
        `people.json maps TMDB ${id} to more than one name: ${canonical
          .map((row) => row.name)
          .join(", ")}. If they are one person, mark the variants with aliasOf.`,
      );
    }
  }
  return errors;
}

export function strayPortraitPaths(details: CeremonyDetail[]): string[] {
  const stray: string[] = [];
  for (const detail of details) {
    for (const group of detail.groups) {
      for (const category of group.categories) {
        for (const winner of category.winners) {
          if (winner.portraitPath && !isPortraitCategory(category.id)) {
            stray.push(
              `${detail.ceremony.slug}:${category.id}:${winner.names[0] ?? "?"}`,
            );
          }
        }
        for (const nominee of category.nominees) {
          if (nominee.portraitPath) {
            stray.push(
              `${detail.ceremony.slug}:${category.id}:${nominee.names[0] ?? "?"}`,
            );
          }
        }
      }
    }
  }
  return stray;
}

export function attachWinnerPortraits(
  details: CeremonyDetail[],
  people: PersonLink[],
  fileExists: (relativeFromImages: string) => boolean,
): CeremonyDetail[] {
  const byName = new Map(people.map((link) => [link.name, link]));
  for (const detail of details) {
    for (const group of detail.groups) {
      for (const category of group.categories) {
        if (!isPortraitCategory(category.id)) {
          for (const row of [...category.winners, ...category.nominees]) {
            delete row.portraitPath;
          }
          continue;
        }
        for (const winner of category.winners) {
          const link = byName.get(winner.names[0] ?? "");
          if (link?.tmdbId == null) {
            delete winner.portraitPath;
            continue;
          }
          const relative = path.posix.join("people", portraitFileName(link.tmdbId));
          if (fileExists(relative)) {
            winner.portraitPath = portraitWebPath(link.tmdbId);
          } else {
            delete winner.portraitPath;
          }
        }
      }
    }
  }
  return details;
}

const TMDB_SEARCH = "https://api.themoviedb.org/3/search/person";
const TMDB_CREDITS = "https://api.themoviedb.org/3/movie";

export async function discoverPeople(
  jobs: PortraitJob[],
  existing: PersonLink[],
  deps: {
    apiKey: string;
    fetchFn: typeof fetch;
    log?: (message: string) => void;
  },
): Promise<PersonLink[]> {
  const known = new Set(existing.map((link) => link.name));
  const discovered: PersonLink[] = [];
  const log = deps.log ?? console.log;

  for (const job of jobs) {
    if (known.has(job.name)) continue;
    try {
      const searchUrl = `${TMDB_SEARCH}?api_key=${deps.apiKey}&query=${encodeURIComponent(job.name)}`;
      const searchRes = await deps.fetchFn(searchUrl);
      if (!searchRes.ok) {
        throw new Error(`search failed: ${searchRes.status}`);
      }
      const searchBody = (await searchRes.json()) as {
        results?: PersonCandidate[];
      };
      const creditsRes = await deps.fetchFn(
        `${TMDB_CREDITS}/${job.movieTmdbId}/credits?api_key=${deps.apiKey}`,
      );
      if (!creditsRes.ok) {
        throw new Error(`credits failed: ${creditsRes.status}`);
      }
      const credits = (await creditsRes.json()) as {
        cast?: { id: number }[];
        crew?: { id: number }[];
      };
      const match = pickCreditMatch(
        searchBody.results ?? [],
        creditedPersonIds(credits),
      );
      if (match.status === "many") {
        log(
          `Ambiguous person "${job.name}" on ${job.movieTitle}: ${match.matches
            .map((person) => `TMDB ${person.id}`)
            .join(", ")}. Resolve manually in data/people.json.`,
        );
        continue;
      }
      if (match.status === "none") {
        discovered.push({
          name: job.name,
          tmdbId: null,
          provenBy: job.movieTitle,
        });
        continue;
      }
      discovered.push({
        name: job.name,
        tmdbId: match.matches[0].id,
        provenBy: job.movieTitle,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      log(`Failed to resolve "${job.name}": ${message}`);
    }
  }

  return discovered;
}
