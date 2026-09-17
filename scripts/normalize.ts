import { existsSync } from "node:fs";
import { readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  ceremonyDetailSchema,
  gridEntrySchema,
  parseData,
  searchDocSchema,
} from "@/lib/schemas";
import { buildCeremonyDetails, buildGridEntries } from "./lib/build-details";
import { buildSearchIndex } from "./lib/build-search";
import { DATA_DIR, fetchCached, writeJson } from "./lib/cache";
import { HISTORICAL_URL, loadHistoricalRecords } from "./lib/load-historical";
import {
  loadOfficialRecords,
  mergeNominationSources,
} from "./lib/load-official";
import { attachBestPicturePosters, IMAGES_DIR } from "./lib/posters";
import { dataWarnings } from "./data-check";

/**
 * Rebuild data/ from the historical feed plus any official scrapes in
 * data/raw/. Network is used only on a historical cache miss (.cache/).
 * Production `npm run build` does not run this — it only checks the
 * committed artifacts — so a Vercel build never depends on GitHub being up.
 *
 * Official records win over historical ones for the same ordinal: the Academy
 * database is the source of truth. The scraper never writes these artifacts.
 */
export async function normalizeData(): Promise<void> {
  const rawText = await fetchCached(HISTORICAL_URL, "oscar-nominations.json");
  const historical = loadHistoricalRecords(JSON.parse(rawText) as unknown);
  const official = await loadOfficialRecords();
  const records = mergeNominationSources(historical, official);
  const details = buildCeremonyDetails(records);
  attachBestPicturePosters(details, (relative) =>
    existsSync(path.join(IMAGES_DIR, relative)),
  );
  const index = buildGridEntries(details);
  const search = buildSearchIndex(details);

  parseData(z.array(gridEntrySchema).min(1), index, "index.json");
  parseData(z.array(searchDocSchema), search, "search.json");
  for (const detail of details) {
    parseData(
      ceremonyDetailSchema,
      detail,
      `ceremonies/${detail.ceremony.slug}.json`,
    );
  }

  const indexPath = path.join(DATA_DIR, "index.json");
  const searchPath = path.join(DATA_DIR, "search.json");
  const ceremoniesDir = path.join(DATA_DIR, "ceremonies");
  await writeJson(indexPath, index);
  await writeFile(searchPath, `${JSON.stringify(search)}\n`, "utf8");

  const written = new Set<string>();
  for (const detail of details) {
    const filename = `${detail.ceremony.slug}.json`;
    await writeJson(path.join(ceremoniesDir, filename), detail);
    written.add(filename);
  }

  const existing = (await readdir(ceremoniesDir).catch(() => [])).filter((name) =>
    name.endsWith(".json"),
  );
  for (const name of existing) {
    if (!written.has(name)) {
      await unlink(path.join(ceremoniesDir, name));
    }
  }

  const indexBytes = Buffer.byteLength(
    `${JSON.stringify(index, null, 2)}\n`,
    "utf8",
  );
  const searchBytes = Buffer.byteLength(`${JSON.stringify(search)}\n`, "utf8");
  for (const warning of dataWarnings({ indexBytes, searchBytes, details })) {
    console.warn(warning);
  }

  console.log(
    `Wrote ${index.length} grid entries, ${search.length} search docs, and ${details.length} ceremony files to data/`,
  );
}

const invokedFromCli =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedFromCli) {
  normalizeData().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
