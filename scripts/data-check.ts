import { existsSync } from "node:fs";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  ceremonyDetailSchema,
  gridEntrySchema,
  parseData,
  type CeremonyDetail,
  type GridEntry,
} from "@/lib/schemas";
import { DATA_DIR } from "./lib/cache";

/** Soft budget for the grid payload. D15 will enforce this in integrity tests. */
export const INDEX_JSON_BUDGET_BYTES = 128 * 1024;

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
  details: CeremonyDetail[];
}): string[] {
  const warnings: string[] = [];
  if (args.indexBytes > INDEX_JSON_BUDGET_BYTES) {
    warnings.push(
      `index.json is ${args.indexBytes} bytes; budget is ${INDEX_JSON_BUDGET_BYTES}`,
    );
  }
  for (const detail of args.details) {
    const count = nominationCount(detail);
    if (count < NOMINATION_COUNT_MIN || count > NOMINATION_COUNT_MAX) {
      warnings.push(
        `Ceremony ${detail.ceremony.ordinal} (${detail.ceremony.slug}) has ${count} nominations (expected ${NOMINATION_COUNT_MIN}–${NOMINATION_COUNT_MAX})`,
      );
    }
  }
  return warnings;
}

/**
 * Validate data/ as it exists on disk. No network, no writes.
 * `npm run build` runs this instead of regenerating so the site build never
 * depends on GitHub or the Academy being reachable.
 */
export async function checkDataDir(dataDir: string): Promise<void> {
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

  const indexBytes = (await stat(indexPath)).size;
  for (const warning of dataWarnings({ indexBytes, details })) {
    console.warn(warning);
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
