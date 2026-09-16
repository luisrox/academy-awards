import { readdir, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  ceremonyDetailSchema,
  gridEntrySchema,
  parseData,
} from "@/lib/schemas";
import { buildCeremonyDetails, buildGridEntries } from "./lib/build-details";
import { DATA_DIR, fetchCached, writeJson } from "./lib/cache";
import { loadHistoricalRecords } from "./lib/load-historical";
import { dataWarnings } from "./data-check";

const HISTORICAL_URL =
  "https://raw.githubusercontent.com/delventhalz/json-nominations/main/oscar-nominations.json";

/**
 * Rebuild data/ from the historical feed. Network is used only on a cache miss
 * (.cache/). Production `npm run build` does not run this — it only checks the
 * committed artifacts — so a Vercel build never depends on GitHub being up.
 */
export async function normalizeData(): Promise<void> {
  const rawText = await fetchCached(HISTORICAL_URL, "oscar-nominations.json");
  const records = loadHistoricalRecords(JSON.parse(rawText) as unknown);
  const details = buildCeremonyDetails(records);
  const index = buildGridEntries(details);

  parseData(z.array(gridEntrySchema).min(1), index, "index.json");
  for (const detail of details) {
    parseData(
      ceremonyDetailSchema,
      detail,
      `ceremonies/${detail.ceremony.slug}.json`,
    );
  }

  const indexPath = path.join(DATA_DIR, "index.json");
  const ceremoniesDir = path.join(DATA_DIR, "ceremonies");
  await writeJson(indexPath, index);

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
  for (const warning of dataWarnings({ indexBytes, details })) {
    console.warn(warning);
  }

  console.log(
    `Wrote ${index.length} grid entries and ${details.length} ceremony files to data/`,
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
