import { describe, expect, it } from "vitest";
import { loadHistoricalRecords } from "./load-historical";

function source(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    category: "Best Picture",
    year: "2023",
    nominees: ["Oppenheimer"],
    movies: [
      { title: "Oppenheimer", tmdb_id: 872585, imdb_id: "tt15398776" },
    ],
    won: true,
    ...overrides,
  };
}

describe("loadHistoricalRecords", () => {
  it("maps a valid record to the ceremony ordinal and canonical id", () => {
    const [record] = loadHistoricalRecords([source()]);
    expect(record.ordinal).toBe(96);
    expect(record.categoryId).toBe("best-picture");
    expect(record.won).toBe(true);
    expect(record.names).toEqual(["Oppenheimer"]);
  });

  it("joins a straddled film year to the 1st ceremony", () => {
    const [record] = loadHistoricalRecords([
      source({
        year: "1927/28",
        nominees: ["Wings"],
        movies: [{ title: "Wings", tmdb_id: 28966, imdb_id: "tt0018578" }],
      }),
    ]);
    expect(record.ordinal).toBe(1);
    expect(record.categoryId).toBe("best-picture");
  });

  it("throws the exact unknown category name", () => {
    expect(() =>
      loadHistoricalRecords([source({ category: "Best Invented Category" })]),
    ).toThrow(/Best Invented Category/);
  });

  it("throws on an orphan film year such as 1933", () => {
    expect(() => loadHistoricalRecords([source({ year: "1933" })])).toThrow(
      /1933/,
    );
  });

  it("renames tmdb_id and imdb_id to camelCase", () => {
    const [record] = loadHistoricalRecords([source()]);
    expect(record.movies).toEqual([
      { title: "Oppenheimer", tmdbId: 872585, imdbId: "tt15398776" },
    ]);
    expect(record.movies[0]).not.toHaveProperty("tmdb_id");
    expect(record.movies[0]).not.toHaveProperty("imdb_id");
  });

  it("uses the era label, not the dataset name, for 2023 costume design", () => {
    const [record] = loadHistoricalRecords([
      source({
        category: "Best Costume Design (Color)",
        nominees: ["Holly Waddington"],
        movies: [{ title: "Poor Things" }],
      }),
    ]);
    expect(record.categoryId).toBe("best-costume-design");
    expect(record.categoryLabel).toBe("Best Costume Design");
  });
});
