import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { movieSchema, parseData } from "@/lib/schemas";
import { RAW_DIR } from "./cache";
import type { NominationRecord } from "./load-historical";

const OFFICIAL_FILE = /^official-(\d+)\.json$/;

export const officialRecordSchema = z.object({
  ordinal: z.number().int().positive(),
  categoryId: z.string().min(1),
  categoryLabel: z.string().min(1),
  names: z.array(z.string()),
  movies: z.array(movieSchema),
  won: z.boolean(),
});

/**
 * Overlay official Academy records onto the historical feed.
 *
 * Precedence: the official source wins. Any ordinal present in
 * data/raw/official-{ordinal}.json replaces every historical row for that
 * edition, because awardsdatabase.oscars.org is the source of truth.
 * Historical rows for uncovered ordinals are kept as-is (including tmdb/imdb ids).
 */
export function mergeNominationSources(
  historical: NominationRecord[],
  official: NominationRecord[],
): NominationRecord[] {
  const officialOrdinals = new Set(official.map((record) => record.ordinal));
  return [
    ...historical.filter((record) => !officialOrdinals.has(record.ordinal)),
    ...official,
  ];
}

/**
 * Read committed official scrapes. Missing tmdbId/imdbId is expected: the
 * Academy HTML has titles only. Poster download (step 28) must tolerate that.
 */
export async function loadOfficialRecords(
  rawDir: string = RAW_DIR,
): Promise<NominationRecord[]> {
  if (!existsSync(rawDir)) return [];

  const files = (await readdir(rawDir))
    .filter((name) => OFFICIAL_FILE.test(name))
    .sort();
  const records: NominationRecord[] = [];

  for (const name of files) {
    const ordinal = Number(name.match(OFFICIAL_FILE)?.[1]);
    const parsed = parseData(
      z.array(officialRecordSchema),
      JSON.parse(await readFile(path.join(rawDir, name), "utf8")) as unknown,
      `data/raw/${name}`,
    );
    const mismatch = parsed.find((record) => record.ordinal !== ordinal);
    if (mismatch) {
      throw new Error(
        `data/raw/${name} contains ordinal ${mismatch.ordinal}; expected ${ordinal}`,
      );
    }
    records.push(...parsed);
  }

  return records;
}
