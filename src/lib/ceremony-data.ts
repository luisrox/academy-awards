import { existsSync, readFileSync } from "node:fs";
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

/**
 * Build-time data access. These functions read `data/` from disk and must
 * only run in Server Components, `generateStaticParams`, or other
 * build/server contexts — never in client components or the browser.
 *
 * This module is the application's only door into `data/`. Components import
 * from here; they never import JSON files directly.
 */
const DATA_DIR = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "data",
);

const SLUG_PATTERN = /^[0-9]{4}(?:-[a-z0-9]+)?$/i;

function readJson(relativePath: string): unknown {
  return JSON.parse(readFileSync(path.join(DATA_DIR, relativePath), "utf8"));
}

export function getGridEntries(): GridEntry[] {
  return parseData(
    z.array(gridEntrySchema).min(1),
    readJson("index.json"),
    "index.json",
  );
}

export function getAllSlugs(): string[] {
  return getGridEntries().map((entry) => entry.slug);
}

export function getCeremonyDetail(slug: string): CeremonyDetail | null {
  if (!SLUG_PATTERN.test(slug)) return null;
  const file = path.join(DATA_DIR, "ceremonies", `${slug}.json`);
  if (!existsSync(file)) return null;
  return parseData(
    ceremonyDetailSchema,
    JSON.parse(readFileSync(file, "utf8")) as unknown,
    `ceremonies/${slug}.json`,
  );
}
