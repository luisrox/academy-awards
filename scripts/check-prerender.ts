import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAllSlugs } from "@/lib/ceremony-data";

export type PrerenderManifest = {
  routes?: Record<string, unknown>;
};

export function missingCeremonyPrerenders(
  manifest: PrerenderManifest,
  slugs: string[],
): string[] {
  const routes = new Set(Object.keys(manifest.routes ?? {}));
  return slugs.filter((slug) => !routes.has(`/${slug}`));
}

export function checkPrerenderManifest(
  manifest: PrerenderManifest,
  slugs: string[],
): void {
  const missing = missingCeremonyPrerenders(manifest, slugs);
  if (missing.length > 0) {
    throw new Error(
      `Expected ${slugs.length} prerendered ceremony routes; missing ${missing.length}: ${missing.join(", ")}`,
    );
  }
}

const SEARCH_INDEX_MARKER = '"kind":"film"';
const SEARCH_INDEX_LEAK_THRESHOLD = 20;

/** True when a client chunk looks like it inlined data/search.json. */
export function clientChunksContainSearchIndex(contents: string[]): boolean {
  return contents.some((content) => {
    let count = 0;
    let from = 0;
    while ((from = content.indexOf(SEARCH_INDEX_MARKER, from)) !== -1) {
      count += 1;
      if (count >= SEARCH_INDEX_LEAK_THRESHOLD) return true;
      from += SEARCH_INDEX_MARKER.length;
    }
    return false;
  });
}

export function clientChunkFiles(staticDir: string): string[] {
  if (!existsSync(staticDir)) return [];
  return readdirSync(staticDir, { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(".js"))
    .map((name) => path.join(staticDir, name));
}

function assertSearchIndexStayedOutOfClientBundle(): void {
  const staticDir = path.join(process.cwd(), ".next", "static");
  const files = clientChunkFiles(staticDir);
  const contents = files.map((file) => readFileSync(file, "utf8"));
  if (clientChunksContainSearchIndex(contents)) {
    throw new Error("search.json leaked into the client JavaScript bundle");
  }
}

function runCli(): void {
  const manifestPath =
    process.argv[2] ?? path.join(process.cwd(), ".next", "prerender-manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`Missing prerender manifest: ${manifestPath}`);
  }
  const manifest = JSON.parse(
    readFileSync(manifestPath, "utf8"),
  ) as PrerenderManifest;
  checkPrerenderManifest(manifest, getAllSlugs());
  assertSearchIndexStayedOutOfClientBundle();
  console.log(`Prerendered ${getAllSlugs().length} ceremony routes`);
}

const invokedFromCli =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (invokedFromCli) {
  try {
    runCli();
  } catch (error: unknown) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
