import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CATEGORIES, CATEGORY_GROUPS, resolveCategoryId } from "@/data/categories";
import { CEREMONIES } from "@/data/ceremonies";
import {
  ceremonyDetailSchema,
  gridEntrySchema,
  parseData,
} from "@/lib/schemas";
import {
  INDEX_JSON_BUDGET_BYTES,
  nominationCount,
} from "../../scripts/data-check";
import { DATA_DIR, fetchCached } from "../../scripts/lib/cache";
import {
  HISTORICAL_URL,
  loadHistoricalRecords,
} from "../../scripts/lib/load-historical";
import {
  loadOfficialRecords,
  mergeNominationSources,
} from "../../scripts/lib/load-official";
import {
  allCategories,
  detailPath,
  indexPath,
  loadDetail,
  loadIndex,
} from "./artifacts";

/**
 * D1–D6 (ceremony table shape: 98 rows, slugs, 1930/1933, film years)
 * live in src/data/ceremonies.test.ts. This file covers D7–D15 on data/.
 */

function entryKey(entry: { names: string[]; movies: { title: string }[] }): string {
  return JSON.stringify({
    names: [...entry.names].sort(),
    titles: entry.movies.map((movie) => movie.title).sort(),
  });
}

describe("data integrity D7–D15", () => {
  it("D7: every known slug has a detail file", () => {
    const missing = CEREMONIES.filter(
      (ceremony) => !existsSync(detailPath(ceremony.slug)),
    ).map((ceremony) => ceremony.slug);
    expect(missing).toEqual([]);
  });

  it("D8: every historical dataset category name resolves in the dictionary", async () => {
    const raw = JSON.parse(
      await fetchCached(HISTORICAL_URL, "oscar-nominations.json"),
    ) as { category: string }[];
    const unmapped = [
      ...new Set(
        raw
          .map((record) => record.category)
          .filter((name) => resolveCategoryId(name) === undefined),
      ),
    ];
    expect(unmapped).toEqual([]);
  });

  it("D9: every canonical id used in details belongs to a declared group", () => {
    const knownGroups = new Set(CATEGORY_GROUPS.map((group) => group.id));
    const definitionById = new Map(
      CATEGORIES.map((category) => [category.id, category]),
    );
    const unknown: string[] = [];
    for (const entry of loadIndex()) {
      for (const category of allCategories(loadDetail(entry.slug))) {
        const definition = definitionById.get(category.id);
        if (!definition || !knownGroups.has(definition.group)) {
          unknown.push(`${entry.slug}:${category.id}`);
        }
      }
    }
    expect(unknown).toEqual([]);
  });

  it("D10: every category in every detail has at least one winner", () => {
    const empty: string[] = [];
    for (const entry of loadIndex()) {
      for (const category of allCategories(loadDetail(entry.slug))) {
        if (category.winners.length === 0) {
          empty.push(`${entry.slug}:${category.id}`);
        }
      }
    }
    expect(empty).toEqual([]);
  });

  it("D11: no nomination sits in both winners and nominees of the same category", () => {
    const overlaps: string[] = [];
    for (const entry of loadIndex()) {
      for (const category of allCategories(loadDetail(entry.slug))) {
        const winnerKeys = new Set(category.winners.map(entryKey));
        for (const nominee of category.nominees) {
          if (winnerKeys.has(entryKey(nominee))) {
            overlaps.push(`${entry.slug}:${category.id}:${entryKey(nominee)}`);
          }
        }
      }
    }
    expect(overlaps).toEqual([]);
  });

  it("D12: every grid entry has at least one headline winner", () => {
    for (const entry of loadIndex()) {
      expect(entry.headline.length, entry.slug).toBeGreaterThan(0);
      for (const winner of entry.headline) {
        expect(winner.winner.length, entry.slug).toBeGreaterThan(0);
      }
    }
  });

  it("D13: nomination totals in details match historical plus official raw", async () => {
    const historical = loadHistoricalRecords(
      JSON.parse(await fetchCached(HISTORICAL_URL, "oscar-nominations.json")),
    );
    const records = mergeNominationSources(
      historical,
      await loadOfficialRecords(),
    );
    const fromDetails = loadIndex()
      .map((entry) => nominationCount(loadDetail(entry.slug)))
      .reduce((sum, count) => sum + count, 0);
    expect(fromDetails).toBe(records.length);
  });

  it("D14: every artifact passes Zod validation", () => {
    parseData(
      z.array(gridEntrySchema).min(1),
      JSON.parse(readFileSync(indexPath(), "utf8")) as unknown,
      "index.json",
    );
    const ceremonyDir = path.join(DATA_DIR, "ceremonies");
    for (const name of readdirSync(ceremonyDir).filter((file) =>
      file.endsWith(".json"),
    )) {
      parseData(
        ceremonyDetailSchema,
        JSON.parse(readFileSync(path.join(ceremonyDir, name), "utf8")) as unknown,
        `ceremonies/${name}`,
      );
    }
  });

  it("D15: index.json stays under its size budget", () => {
    expect(statSync(indexPath()).size).toBeLessThanOrEqual(
      INDEX_JSON_BUDGET_BYTES,
    );
  });
});
