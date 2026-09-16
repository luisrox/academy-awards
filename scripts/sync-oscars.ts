import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { CACHE_DIR, RAW_DIR, writeJson } from "./lib/cache";
import type { NominationRecord } from "./lib/load-historical";
import { parseOfficialResults } from "./lib/parse-official";

/** Browser-like UA plus an identifiable token; the Academy host rejects bare bots. */
export const OFFICIAL_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 OscarsWinnersSite/1.0";

export const FETCH_ATTEMPTS = 3;
export const FETCH_BACKOFF_MS = 1000;

export type SyncOscarsOptions = {
  ordinal: number;
  confirmOverwrite?: boolean;
  cacheDir?: string;
  rawDir?: string;
  fetchImpl?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  log?: (line: string) => void;
};

export type SyncOscarsResult = {
  path: string;
  written: boolean;
  suspicious: boolean;
  categoryCount: number;
};

/**
 * Modern ceremonies have ~23–24 competitive categories. Below this floor the
 * scrape is written anyway (section 10.2) but flagged as suspicious.
 */
export function expectedCategoryFloor(ordinal: number): number {
  if (ordinal >= 90) return 20;
  if (ordinal >= 76) return 18;
  if (ordinal >= 30) return 12;
  return 7;
}

export function officialResultsUrl(ordinal: number): string {
  const query = JSON.stringify({
    AwardShowNumberFrom: ordinal,
    AwardShowNumberTo: ordinal,
    Sort: "3-Award Category-Chron",
    Search: 30,
  });
  return `https://awardsdatabase.oscars.org/search/getresults?query=${encodeURIComponent(query)}`;
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchOfficialHtml(
  ordinal: number,
  options: SyncOscarsOptions,
): Promise<string> {
  const cacheDir = options.cacheDir ?? CACHE_DIR;
  const cacheFile = path.join(cacheDir, `official-${ordinal}.html`);
  if (existsSync(cacheFile)) {
    return readFile(cacheFile, "utf8");
  }

  const url = officialResultsUrl(ordinal);
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  let lastStatus = 0;
  let lastStatusText = "";

  for (let attempt = 0; attempt < FETCH_ATTEMPTS; attempt++) {
    const response = await fetchImpl(url, {
      headers: {
        "user-agent": OFFICIAL_USER_AGENT,
        accept: "text/html",
      },
    });
    if (response.ok) {
      const html = await response.text();
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cacheFile, html, "utf8");
      return html;
    }
    lastStatus = response.status;
    lastStatusText = response.statusText;
    if (attempt < FETCH_ATTEMPTS - 1) {
      await sleep(FETCH_BACKOFF_MS * 2 ** attempt);
    }
  }

  throw new Error(
    `Official results request failed with status ${lastStatus} ${lastStatusText}`.trim(),
  );
}

function categoryCount(records: NominationRecord[]): number {
  return new Set(records.map((record) => record.categoryId)).size;
}

function formatDiff(
  previous: NominationRecord[] | undefined,
  next: NominationRecord[],
): string {
  const nextCount = categoryCount(next);
  if (!previous) {
    return `Existing file is not valid JSON. Incoming records: ${nextCount} categories.`;
  }
  const prevCount = categoryCount(previous);
  const prevIds = new Set(previous.map((record) => record.categoryId));
  const nextIds = new Set(next.map((record) => record.categoryId));
  const added = [...nextIds].filter((id) => !prevIds.has(id));
  const removed = [...prevIds].filter((id) => !nextIds.has(id));
  const lines = [`Categories: ${prevCount} → ${nextCount}`];
  if (added.length > 0) lines.push(`Added: ${added.join(", ")}`);
  if (removed.length > 0) lines.push(`Removed: ${removed.join(", ")}`);
  return lines.join("\n");
}

function readExistingRecords(text: string): NominationRecord[] | undefined {
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as NominationRecord[]) : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Download one official ceremony into data/raw/official-{ordinal}.json.
 * Never writes final data/ artifacts — normalize.ts is the only producer of those.
 */
export async function syncOscars(
  options: SyncOscarsOptions,
): Promise<SyncOscarsResult> {
  const log = options.log ?? console.log;
  const rawDir = options.rawDir ?? RAW_DIR;
  const dest = path.join(rawDir, `official-${options.ordinal}.json`);

  const html = await fetchOfficialHtml(options.ordinal, options);
  const records = parseOfficialResults(html, options.ordinal);
  const count = categoryCount(records);
  const floor = expectedCategoryFloor(options.ordinal);
  const suspicious = count < floor;

  if (suspicious) {
    log(
      `SUSPICIOUS: ${options.ordinal}th ceremony has ${count} ${
        count === 1 ? "category" : "categories"
      }; expected at least ${floor}`,
    );
  }

  if (existsSync(dest) && !options.confirmOverwrite) {
    const existingText = await readFile(dest, "utf8");
    log(formatDiff(readExistingRecords(existingText), records));
    throw new Error(
      `Refusing to overwrite ${dest} without confirmation; pass --yes to overwrite`,
    );
  }

  await writeJson(dest, records);
  log(`Wrote ${dest} (${count} categories, ${records.length} nominations)`);
  return { path: dest, written: true, suspicious, categoryCount: count };
}

function parseArgs(argv: string[]): { ordinal: number; confirmOverwrite: boolean } {
  const confirmOverwrite = argv.includes("--yes") || argv.includes("-y");
  const ordinalArg = argv.find((arg) => /^-?\d+$/.test(arg));
  const ordinal = ordinalArg === undefined ? Number.NaN : Number(ordinalArg);
  if (!Number.isInteger(ordinal) || ordinal < 1) {
    throw new Error("Usage: npm run sync:oscars -- <ordinal> [--yes]");
  }
  return { ordinal, confirmOverwrite };
}

const invokedFromCli =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedFromCli) {
  try {
    const { ordinal, confirmOverwrite } = parseArgs(process.argv.slice(2));
    syncOscars({ ordinal, confirmOverwrite }).catch((error: unknown) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
