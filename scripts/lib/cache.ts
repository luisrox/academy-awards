import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const REPO_ROOT = path.resolve(import.meta.dirname, "..", "..");
export const CACHE_DIR = path.join(REPO_ROOT, ".cache");
export const DATA_DIR = path.join(REPO_ROOT, "data");
export const RAW_DIR = path.join(DATA_DIR, "raw");

/**
 * Fetches a URL once and keeps it under .cache/ so repeated builds and script
 * runs never hammer the upstream sources.
 */
export async function fetchCached(
  url: string,
  filename: string,
  options: { force?: boolean; headers?: Record<string, string> } = {},
): Promise<string> {
  const target = path.join(CACHE_DIR, filename);
  if (!options.force && existsSync(target)) {
    return readFile(target, "utf8");
  }

  const response = await fetch(url, {
    headers: {
      "user-agent":
        "oscars-winners-site/1.0 (static site data build; contact via repo)",
      ...options.headers,
    },
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }

  const body = await response.text();
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(target, body, "utf8");
  return body;
}

export async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function readJsonIfExists<T>(filePath: string): Promise<T | undefined> {
  if (!existsSync(filePath)) return undefined;
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}
