import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import type { CeremonyDetail, GridEntry } from "@/lib/schemas";
import { bestPictureMovie } from "@/lib/poster";
import { REPO_ROOT } from "./cache";

export { bestPictureMovie };

export const PUBLIC_DIR = path.join(REPO_ROOT, "public");
export const IMAGES_DIR = path.join(PUBLIC_DIR, "images");
export const IMAGES_BUDGET_BYTES = 4 * 1024 * 1024;

export type PosterJob = {
  slug: string;
  title: string;
  tmdbId: number;
};

export function posterFileName(tmdbId: number): string {
  return `${tmdbId}.webp`;
}

export function posterWebPath(tmdbId: number): string {
  return `/images/posters/${posterFileName(tmdbId)}`;
}

export function collectPosterJobs(details: CeremonyDetail[]): PosterJob[] {
  const jobs: PosterJob[] = [];
  for (const detail of details) {
    const movie = bestPictureMovie(detail);
    if (movie?.tmdbId == null) continue;
    jobs.push({
      slug: detail.ceremony.slug,
      title: movie.title,
      tmdbId: movie.tmdbId,
    });
  }
  return jobs;
}

/** Set posterPath only when the webp is already on disk. */
export function attachBestPicturePosters(
  details: CeremonyDetail[],
  fileExists: (relativeFromImages: string) => boolean,
): CeremonyDetail[] {
  for (const detail of details) {
    const movie = bestPictureMovie(detail);
    if (movie?.tmdbId == null) continue;
    const relative = path.posix.join("posters", posterFileName(movie.tmdbId));
    if (fileExists(relative)) {
      movie.posterPath = posterWebPath(movie.tmdbId);
    } else {
      delete movie.posterPath;
    }
  }
  return details;
}

export function collectImagePaths(
  index: GridEntry[],
  details: CeremonyDetail[],
): string[] {
  const paths = new Set<string>();
  for (const entry of index) {
    if (entry.posterPath) paths.add(entry.posterPath);
  }
  for (const detail of details) {
    for (const group of detail.groups) {
      for (const category of group.categories) {
        for (const row of [...category.winners, ...category.nominees]) {
          for (const movie of row.movies) {
            if (movie.posterPath) paths.add(movie.posterPath);
          }
        }
      }
    }
  }
  return [...paths];
}

export function resolvePublicAsset(webPath: string, publicDir: string): string {
  if (!webPath.startsWith("/images/")) {
    throw new Error(`Image path is not under /images/: ${webPath}`);
  }
  const relative = webPath.replace(/^\//, "").split("/").join(path.sep);
  const resolved = path.resolve(publicDir, relative);
  const root = path.resolve(publicDir);
  if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
    throw new Error(`Image path escapes public dir: ${webPath}`);
  }
  return resolved;
}

export function directorySizeBytes(root: string): number {
  if (!existsSync(root)) return 0;
  let total = 0;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    const stats = statSync(current);
    if (stats.isDirectory()) {
      for (const name of readdirSync(current)) {
        stack.push(path.join(current, name));
      }
      continue;
    }
    total += stats.size;
  }
  return total;
}

export function missingImageFiles(
  webPaths: string[],
  publicDir: string,
): string[] {
  return webPaths.filter((webPath) => !existsSync(resolvePublicAsset(webPath, publicDir)));
}

export function heaviestImages(
  root: string,
  limit = 8,
): { file: string; bytes: number }[] {
  if (!existsSync(root)) return [];
  const files: { file: string; bytes: number }[] = [];
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) break;
    const stats = statSync(current);
    if (stats.isDirectory()) {
      for (const name of readdirSync(current)) {
        stack.push(path.join(current, name));
      }
      continue;
    }
    files.push({ file: path.relative(root, current), bytes: stats.size });
  }
  return files.sort((a, b) => b.bytes - a.bytes).slice(0, limit);
}
