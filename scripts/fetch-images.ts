import { existsSync, readFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ceremonyDetailSchema, parseData, type PersonLink } from "@/lib/schemas";
import { DATA_DIR, REPO_ROOT, writeJson } from "./lib/cache";
import {
  attachFilmIds,
  collectFilmJobs,
  discoverFilms,
  loadFilms,
  mergeFilms,
} from "./lib/films";
import {
  collectPortraitJobs,
  discoverPeople,
  loadPeople,
  mergePeople,
  portraitFileName,
} from "./lib/people";
import {
  IMAGES_BUDGET_BYTES,
  IMAGES_DIR,
  collectPosterJobs,
  directorySizeBytes,
  posterFileName,
  type PosterJob,
} from "./lib/posters";

const TMDB_MOVIE = "https://api.themoviedb.org/3/movie";
const TMDB_PERSON = "https://api.themoviedb.org/3/person";
const TMDB_POSTER = "https://image.tmdb.org/t/p/w342";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w185";

export function loadTmdbApiKey(env: NodeJS.ProcessEnv = process.env): string {
  const key = env.TMDB_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "TMDB_API_KEY is missing. It is only required for this script — add it to .env.local. The site build never reads it.",
    );
  }
  return key;
}

export function applyEnvFile(
  filePath: string,
  env: NodeJS.ProcessEnv = process.env,
): void {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const name = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (env[name] === undefined) env[name] = value;
  }
}

export async function withRetries<T>(
  work: () => Promise<T>,
  options: {
    attempts?: number;
    delaysMs?: number[];
    sleep?: (ms: number) => Promise<void>;
  } = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delaysMs = options.delaysMs ?? [200, 400, 800];
  const sleep =
    options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      if (index < attempts - 1) {
        await sleep(delaysMs[index] ?? delaysMs[delaysMs.length - 1] ?? 200);
      }
    }
  }
  throw lastError;
}

export type DownloadDeps = {
  apiKey: string;
  jobs: PosterJob[];
  imagesDir: string;
  budgetBytes: number;
  fetchFn: typeof fetch;
  encodeWebp: (bytes: Buffer) => Promise<Buffer>;
  exists?: (filePath: string) => boolean;
  writeFileFn?: (filePath: string, bytes: Buffer) => Promise<void>;
  ensureDir?: (dir: string) => Promise<void>;
  dirSize?: (dir: string) => number;
  sleep?: (ms: number) => Promise<void>;
  log?: (message: string) => void;
};

export type DownloadReport = {
  downloaded: number;
  skippedExisting: number;
  skipped: number;
  failed: number;
};

async function readTmdbPoster(
  tmdbId: number,
  apiKey: string,
  fetchFn: typeof fetch,
): Promise<Buffer | null> {
  const meta = await fetchFn(`${TMDB_MOVIE}/${tmdbId}?api_key=${apiKey}`);
  if (!meta.ok) {
    throw new Error(`TMDB movie ${tmdbId} failed: ${meta.status}`);
  }
  const body = (await meta.json()) as { poster_path?: string | null };
  if (!body.poster_path) return null;
  const image = await fetchFn(`${TMDB_POSTER}${body.poster_path}`);
  if (!image.ok) {
    throw new Error(`TMDB image ${tmdbId} failed: ${image.status}`);
  }
  return Buffer.from(await image.arrayBuffer());
}

export async function downloadBestPicturePosters(
  deps: DownloadDeps,
): Promise<DownloadReport> {
  const exists = deps.exists ?? existsSync;
  const write = deps.writeFileFn ?? writeFile;
  const ensureDir = deps.ensureDir ?? ((dir: string) => mkdir(dir, { recursive: true }).then(() => undefined));
  const sizeOf = deps.dirSize ?? directorySizeBytes;
  const log = deps.log ?? console.log;
  const report: DownloadReport = {
    downloaded: 0,
    skippedExisting: 0,
    skipped: 0,
    failed: 0,
  };

  await ensureDir(path.join(deps.imagesDir, "posters"));

  for (const job of deps.jobs) {
    const dest = path.join(deps.imagesDir, "posters", posterFileName(job.tmdbId));
    if (exists(dest)) {
      report.skippedExisting += 1;
      continue;
    }

    try {
      const raw = await withRetries(
        () => readTmdbPoster(job.tmdbId, deps.apiKey, deps.fetchFn),
        { sleep: deps.sleep },
      );
      if (!raw) {
        report.skipped += 1;
        log(`No TMDB poster for ${job.slug} (${job.title}, tmdb ${job.tmdbId}); skipping.`);
        continue;
      }
      const encoded = await deps.encodeWebp(raw);
      const nextSize = sizeOf(deps.imagesDir) + encoded.length;
      if (nextSize > deps.budgetBytes) {
        throw new Error(
          `Writing ${dest} would take public/images/ to ${nextSize} bytes; budget is ${deps.budgetBytes}. Aborted before write.`,
        );
      }
      await ensureDir(path.dirname(dest));
      await write(dest, encoded);
      report.downloaded += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("would take public/images")) {
        throw error;
      }
      report.failed += 1;
      log(`Failed to download poster for ${job.slug} (${job.title}): ${message}`);
    }
  }

  return report;
}

export type PortraitDownloadDeps = Omit<DownloadDeps, "jobs"> & {
  people: PersonLink[];
};

async function readTmdbProfile(
  tmdbId: number,
  apiKey: string,
  fetchFn: typeof fetch,
): Promise<Buffer | null> {
  const meta = await fetchFn(`${TMDB_PERSON}/${tmdbId}?api_key=${apiKey}`);
  if (!meta.ok) {
    throw new Error(`TMDB person ${tmdbId} failed: ${meta.status}`);
  }
  const body = (await meta.json()) as { profile_path?: string | null };
  if (!body.profile_path) return null;
  const image = await fetchFn(`${TMDB_PROFILE}${body.profile_path}`);
  if (!image.ok) {
    throw new Error(`TMDB profile ${tmdbId} failed: ${image.status}`);
  }
  return Buffer.from(await image.arrayBuffer());
}

export async function downloadPersonPortraits(
  deps: PortraitDownloadDeps,
): Promise<DownloadReport> {
  const exists = deps.exists ?? existsSync;
  const write = deps.writeFileFn ?? writeFile;
  const ensureDir =
    deps.ensureDir ??
    ((dir: string) => mkdir(dir, { recursive: true }).then(() => undefined));
  const sizeOf = deps.dirSize ?? directorySizeBytes;
  const log = deps.log ?? console.log;
  const report: DownloadReport = {
    downloaded: 0,
    skippedExisting: 0,
    skipped: 0,
    failed: 0,
  };

  await ensureDir(path.join(deps.imagesDir, "people"));

  for (const person of deps.people) {
    if (person.tmdbId == null) continue;
    const dest = path.join(
      deps.imagesDir,
      "people",
      portraitFileName(person.tmdbId),
    );
    if (exists(dest)) {
      report.skippedExisting += 1;
      continue;
    }
    try {
      const raw = await withRetries(
        () => readTmdbProfile(person.tmdbId as number, deps.apiKey, deps.fetchFn),
        { sleep: deps.sleep },
      );
      if (!raw) {
        report.skipped += 1;
        log(`No TMDB profile photo for ${person.name} (tmdb ${person.tmdbId}); skipping download.`);
        continue;
      }
      const encoded = await deps.encodeWebp(raw);
      const nextSize = sizeOf(deps.imagesDir) + encoded.length;
      if (nextSize > deps.budgetBytes) {
        throw new Error(
          `Writing ${dest} would take public/images/ to ${nextSize} bytes; budget is ${deps.budgetBytes}. Aborted before write.`,
        );
      }
      await ensureDir(path.dirname(dest));
      await write(dest, encoded);
      report.downloaded += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("would take public/images")) {
        throw error;
      }
      report.failed += 1;
      log(`Failed to download portrait for ${person.name}: ${message}`);
    }
  }

  return report;
}

export function loadCeremonyDetails(dataDir = DATA_DIR) {
  const indexRaw: unknown = JSON.parse(
    readFileSync(path.join(dataDir, "index.json"), "utf8"),
  );
  const slugs = (indexRaw as { slug: string }[]).map((entry) => entry.slug);
  return slugs.map((slug) =>
    parseData(
      ceremonyDetailSchema,
      JSON.parse(
        readFileSync(path.join(dataDir, "ceremonies", `${slug}.json`), "utf8"),
      ) as unknown,
      `ceremonies/${slug}.json`,
    ),
  );
}

async function encodeWebp(bytes: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(bytes).webp({ quality: 78 }).toBuffer();
}

async function encodePortrait(bytes: Buffer): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp(bytes).resize({ width: 132 }).webp({ quality: 78 }).toBuffer();
}

async function runCli(): Promise<void> {
  applyEnvFile(path.join(REPO_ROOT, ".env.local"));
  const apiKey = loadTmdbApiKey();
  const details = loadCeremonyDetails();

  // Editions scraped from the Academy arrive without TMDB ids; resolve them
  // first or there is nothing to download for those years.
  const existingFilms = loadFilms();
  const discoveredFilms = await discoverFilms(
    collectFilmJobs(details),
    existingFilms,
    { apiKey, fetchFn: fetch },
  );
  const films = mergeFilms(existingFilms, discoveredFilms);
  await writeJson(path.join(DATA_DIR, "films.json"), films);
  attachFilmIds(details, films);
  console.log(
    `Films: resolved ${discoveredFilms.filter((film) => film.tmdbId != null).length} new TMDB ids, films.json now has ${films.length} titles.`,
  );

  const posterReport = await downloadBestPicturePosters({
    apiKey,
    jobs: collectPosterJobs(details),
    imagesDir: IMAGES_DIR,
    budgetBytes: IMAGES_BUDGET_BYTES,
    fetchFn: fetch,
    encodeWebp,
  });
  console.log(
    `Posters: downloaded ${posterReport.downloaded}, already on disk ${posterReport.skippedExisting}, skipped ${posterReport.skipped}, failed ${posterReport.failed}.`,
  );

  const existingPeople = loadPeople();
  const discovered = await discoverPeople(
    collectPortraitJobs(details),
    existingPeople,
    { apiKey, fetchFn: fetch },
  );
  const people = mergePeople(existingPeople, discovered);
  await writeJson(path.join(DATA_DIR, "people.json"), people);
  const portraitReport = await downloadPersonPortraits({
    apiKey,
    people,
    imagesDir: IMAGES_DIR,
    budgetBytes: IMAGES_BUDGET_BYTES,
    fetchFn: fetch,
    encodeWebp: encodePortrait,
  });
  console.log(
    `Portraits: downloaded ${portraitReport.downloaded}, already on disk ${portraitReport.skippedExisting}, skipped ${portraitReport.skipped}, failed ${portraitReport.failed}. people.json now has ${people.length} names.`,
  );
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
