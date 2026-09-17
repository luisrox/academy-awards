import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  ceremonyDetailSchema,
  gridEntrySchema,
  parseData,
  searchDocSchema,
  type CeremonyDetail,
  type GridEntry,
} from "@/lib/schemas";
import { DATA_DIR } from "./lib/cache";
import {
  IMAGES_BUDGET_BYTES,
  PUBLIC_DIR,
  bestPictureMovie,
  collectImagePaths,
  directorySizeBytes,
  heaviestImages,
  missingImageFiles,
} from "./lib/posters";

/** Soft budget for the grid payload. D15 will enforce this in integrity tests. */
export const INDEX_JSON_BUDGET_BYTES = 128 * 1024;
export { IMAGES_BUDGET_BYTES };

/**
 * Spec.md 5.2 estimated ~300 KB. The compact index of unique film/person
 * documents per ceremony is larger; SEARCH_JSON_BUDGET_BYTES is the hard cap.
 */
export const SEARCH_JSON_ESTIMATE_BYTES = 300 * 1024;
export const SEARCH_JSON_BUDGET_BYTES = 2 * 1024 * 1024;

/** Inclusive range for nominations (winners + nominees) per ceremony. Outside it, warn. */
export const NOMINATION_COUNT_MIN = 10;
export const NOMINATION_COUNT_MAX = 250;

export function nominationCount(detail: CeremonyDetail): number {
  return detail.groups
    .flatMap((group) => group.categories)
    .reduce(
      (total, category) => total + category.winners.length + category.nominees.length,
      0,
    );
}

export function dataWarnings(args: {
  indexBytes: number;
  searchBytes?: number;
  details: CeremonyDetail[];
}): string[] {
  const warnings: string[] = [];
  if (args.indexBytes > INDEX_JSON_BUDGET_BYTES) {
    warnings.push(
      `index.json is ${args.indexBytes} bytes; budget is ${INDEX_JSON_BUDGET_BYTES}`,
    );
  }
  if (args.searchBytes !== undefined && args.searchBytes > SEARCH_JSON_BUDGET_BYTES) {
    warnings.push(
      `search.json is ${args.searchBytes} bytes; budget is ${SEARCH_JSON_BUDGET_BYTES}`,
    );
  }
  for (const detail of args.details) {
    const count = nominationCount(detail);
    if (count < NOMINATION_COUNT_MIN || count > NOMINATION_COUNT_MAX) {
      warnings.push(
        `Ceremony ${detail.ceremony.ordinal} (${detail.ceremony.slug}) has ${count} nominations (expected ${NOMINATION_COUNT_MIN}–${NOMINATION_COUNT_MAX})`,
      );
    }
    const movie = bestPictureMovie(detail);
    if (movie?.tmdbId != null && !movie.posterPath) {
      warnings.push(
        `Missing Best Picture poster for ${detail.ceremony.ordinal} (${detail.ceremony.slug}) tmdb ${movie.tmdbId}`,
      );
    }
  }
  return warnings;
}

export type CheckDataOptions = {
  publicDir?: string;
  imagesBudgetBytes?: number;
};

/**
 * Validate data/ as it exists on disk. No network, no writes.
 * `npm run build` runs this instead of regenerating so the site build never
 * depends on GitHub or the Academy being reachable.
 */
export async function checkDataDir(
  dataDir: string,
  options: CheckDataOptions = {},
): Promise<void> {
  const indexPath = path.join(dataDir, "index.json");
  if (!existsSync(indexPath)) {
    throw new Error(`Missing ${indexPath}`);
  }

  const indexRaw: unknown = JSON.parse(await readFile(indexPath, "utf8"));
  const index = parseData(z.array(gridEntrySchema).min(1), indexRaw, "index.json");

  const ceremoniesDir = path.join(dataDir, "ceremonies");
  if (!existsSync(ceremoniesDir)) {
    throw new Error(`Missing ceremonies directory: ${ceremoniesDir}`);
  }

  const files = (await readdir(ceremoniesDir)).filter((name) =>
    name.endsWith(".json"),
  );
  const fileSet = new Set(files);
  const details: CeremonyDetail[] = [];

  for (const entry of index) {
    const filename = `${entry.slug}.json`;
    if (!fileSet.has(filename)) {
      throw new Error(
        `index.json slug "${entry.slug}" has no ceremonies/${filename}`,
      );
    }
    const raw: unknown = JSON.parse(
      await readFile(path.join(ceremoniesDir, filename), "utf8"),
    );
    const detail = parseData(
      ceremonyDetailSchema,
      raw,
      `ceremonies/${filename}`,
    );
    if (detail.ceremony.slug !== entry.slug) {
      throw new Error(
        `ceremonies/${filename} slug is "${detail.ceremony.slug}", expected "${entry.slug}"`,
      );
    }
    details.push(detail);
  }

  const indexSlugs = new Set(index.map((entry: GridEntry) => entry.slug));
  for (const file of files) {
    const slug = file.slice(0, -".json".length);
    if (!indexSlugs.has(slug)) {
      throw new Error(`ceremonies/${file} is not listed in index.json`);
    }
  }

  const searchPath = path.join(dataDir, "search.json");
  if (!existsSync(searchPath)) {
    throw new Error(`Missing ${searchPath}`);
  }
  const search = parseData(
    z.array(searchDocSchema),
    JSON.parse(await readFile(searchPath, "utf8")) as unknown,
    "search.json",
  );
  for (const doc of search) {
    if (!indexSlugs.has(doc.slug)) {
      throw new Error(
        `search.json ${doc.kind} "${doc.title}" points at unknown slug "${doc.slug}"`,
      );
    }
  }

  const indexBytes = (await stat(indexPath)).size;
  const searchBytes = (await stat(searchPath)).size;
  for (const warning of dataWarnings({ indexBytes, searchBytes, details })) {
    console.warn(warning);
  }

  const publicDir = options.publicDir ?? PUBLIC_DIR;
  const imagePaths = collectImagePaths(index, details);
  const missing = missingImageFiles(imagePaths, publicDir);
  if (missing.length > 0) {
    throw new Error(
      `Image path does not exist on disk: ${missing.join("; ")}`,
    );
  }

  const imagesDir = path.join(publicDir, "images");
  const imagesBytes = directorySizeBytes(imagesDir);
  const budget = options.imagesBudgetBytes ?? IMAGES_BUDGET_BYTES;
  if (imagesBytes > budget) {
    const heavy = heaviestImages(imagesDir)
      .map((file) => `${file.file} (${file.bytes} bytes)`)
      .join(", ");
    throw new Error(
      `public/images/ is ${imagesBytes} bytes; budget is ${budget}. Heaviest: ${heavy}`,
    );
  }
}

async function runCli(): Promise<void> {
  const dataDir = process.argv[2] ?? DATA_DIR;
  await checkDataDir(dataDir);
}

const invokedFromCli =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedFromCli) {
  runCli().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
