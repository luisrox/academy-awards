import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  loadOfficialRecords,
  mergeNominationSources,
} from "./load-official";
import type { NominationRecord } from "./load-historical";

function rec(
  overrides: Partial<NominationRecord> & Pick<NominationRecord, "ordinal">,
): NominationRecord {
  return {
    categoryId: "best-picture",
    categoryLabel: "Best Picture",
    names: ["A Film"],
    movies: [{ title: "A Film" }],
    won: true,
    ...overrides,
  };
}

describe("mergeNominationSources", () => {
  it("lets the official source replace a historical edition", () => {
    const historical = [
      rec({
        ordinal: 96,
        names: ["Oppenheimer"],
        movies: [{ title: "Oppenheimer", tmdbId: 872585 }],
      }),
      rec({
        ordinal: 97,
        names: ["Stale Historical"],
        movies: [{ title: "Stale Historical", tmdbId: 1 }],
      }),
    ];
    const official = [
      rec({
        ordinal: 97,
        names: ["Anora"],
        movies: [{ title: "Anora" }],
      }),
    ];

    const merged = mergeNominationSources(historical, official);
    const ninetySixth = merged.filter((record) => record.ordinal === 96);
    const ninetySeventh = merged.filter((record) => record.ordinal === 97);

    expect(ninetySixth).toEqual([historical[0]]);
    expect(ninetySeventh).toEqual([official[0]]);
    expect(ninetySeventh[0].movies[0]).not.toHaveProperty("tmdbId");
  });

  it("keeps historical editions that have no official file", () => {
    const historical = [rec({ ordinal: 1, names: ["Wings"] })];
    expect(mergeNominationSources(historical, [])).toEqual(historical);
  });
});

describe("loadOfficialRecords", () => {
  it("reads official-*.json and ignores other files", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "oscars-raw-"));
    try {
      await mkdir(dir, { recursive: true });
      await writeFile(
        path.join(dir, "official-97.json"),
        `${JSON.stringify([rec({ ordinal: 97, names: ["Anora"] })], null, 2)}\n`,
        "utf8",
      );
      await writeFile(path.join(dir, "notes.txt"), "ignore me", "utf8");
      const records = await loadOfficialRecords(dir);
      expect(records).toHaveLength(1);
      expect(records[0].ordinal).toBe(97);
      expect(records[0].movies[0].tmdbId).toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("fails when a file's records do not match its ordinal", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "oscars-raw-bad-"));
    try {
      await writeFile(
        path.join(dir, "official-97.json"),
        `${JSON.stringify([rec({ ordinal: 98 })], null, 2)}\n`,
        "utf8",
      );
      await expect(loadOfficialRecords(dir)).rejects.toThrow(/expected 97/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
