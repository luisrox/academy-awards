import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "./cache";
import {
  parseOfficialResults,
  WINNER_ICON_SELECTOR,
} from "./parse-official";

const FIXTURE = readFileSync(
  path.join(REPO_ROOT, "tests/fixtures/official-98.html"),
  "utf8",
);

describe("parseOfficialResults", () => {
  const records = parseOfficialResults(FIXTURE, 98);

  it("extracts the 24 competitive categories of the 98th ceremony", () => {
    expect(new Set(records.map((record) => record.categoryId)).size).toBe(24);
  });

  it("gives every category at least one winner", () => {
    const byId = new Map<string, typeof records>();
    for (const record of records) {
      const group = byId.get(record.categoryId) ?? [];
      group.push(record);
      byId.set(record.categoryId, group);
    }
    for (const [id, group] of byId) {
      expect(
        group.some((record) => record.won),
        id,
      ).toBe(true);
    }
  });

  it("puts the acting person in names and the film in movies", () => {
    const winner = records.find(
      (record) => record.categoryId === "best-actor" && record.won,
    );
    expect(winner?.names).toEqual(["Michael B. Jordan"]);
    expect(winner?.movies).toEqual([{ title: "Sinners" }]);
  });

  it("puts a picture category title in movies", () => {
    const winner = records.find(
      (record) => record.categoryId === "best-picture" && record.won,
    );
    expect(winner?.movies.map((movie) => movie.title)).toContain(
      "One Battle after Another",
    );
  });

  it("resolves every row to a canonical id", () => {
    for (const record of records) {
      expect(record.categoryId).toBeTruthy();
      expect(record.ordinal).toBe(98);
    }
  });

  it("aborts on empty HTML as an outdated parser", () => {
    expect(() => parseOfficialResults("", 98)).toThrow(/parser needs to be updated/);
  });

  it("aborts when categories exist but the winner icon class is gone", () => {
    const stripped = FIXTURE.replaceAll(
      WINNER_ICON_SELECTOR.slice(1),
      "glyphicon-removed",
    );
    expect(() => parseOfficialResults(stripped, 98)).toThrow(
      /winner icon CSS class/,
    );
  });
});
