import { existsSync, readFileSync } from "node:fs";
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
