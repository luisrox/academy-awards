import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import {
  ceremonyDetailSchema,
  gridEntrySchema,
  parseData,
  searchDocSchema,
  type CeremonyCategory,
  type CeremonyDetail,
  type GridEntry,
  type SearchDoc,
} from "@/lib/schemas";
import { DATA_DIR } from "../../scripts/lib/cache";

export function searchPath(): string {
  return path.join(DATA_DIR, "search.json");
}

export function indexPath(): string {
  return path.join(DATA_DIR, "index.json");
}

export function loadSearch(): SearchDoc[] {
  return parseData(
    z.array(searchDocSchema),
    JSON.parse(readFileSync(searchPath(), "utf8")) as unknown,
    "search.json",
  );
}

export function detailPath(slug: string): string {
  return path.join(DATA_DIR, "ceremonies", `${slug}.json`);
}

export function loadIndex(): GridEntry[] {
  return parseData(
    z.array(gridEntrySchema).min(1),
    JSON.parse(readFileSync(indexPath(), "utf8")) as unknown,
    "index.json",
  );
}

export function loadDetail(slug: string): CeremonyDetail {
  const file = detailPath(slug);
  if (!existsSync(file)) {
    throw new Error(`Missing ceremony file: ${file}`);
  }
  return parseData(
    ceremonyDetailSchema,
    JSON.parse(readFileSync(file, "utf8")) as unknown,
    `ceremonies/${slug}.json`,
  );
}

export function allCategories(detail: CeremonyDetail): CeremonyCategory[] {
  return detail.groups.flatMap((group) => group.categories);
}

export function categoryById(
  detail: CeremonyDetail,
  id: string,
): CeremonyCategory | undefined {
  return allCategories(detail).find((category) => category.id === id);
}

export function pictureWinner(detail: CeremonyDetail): string | undefined {
  return categoryById(detail, "best-picture")?.winners[0]?.names[0];
}
