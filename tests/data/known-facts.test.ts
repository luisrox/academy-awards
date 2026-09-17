import { describe, expect, it } from "vitest";
import { ceremonyByFilmYear } from "@/data/ceremonies";
import { normalizeSearchText } from "@/lib/search";
import { DATA_DIR } from "../../scripts/lib/cache";
import { loadFilms } from "../../scripts/lib/films";
import {
  categoryById,
  loadDetail,
  loadSearch,
  pictureWinner,
} from "./artifacts";

describe("known facts", () => {
  it("1st ceremony (1929): Best Picture is Wings and Unique and Artistic Production exists", () => {
    const detail = loadDetail("1929");
    expect(detail.ceremony.ordinal).toBe(1);
    expect(pictureWinner(detail)).toBe("Wings");
    expect(categoryById(detail, "unique-artistic-production")?.label).toBe(
      "Unique and Artistic Production",
    );
  });

  it("3rd ceremony (1930-3rd) is distinct from the 2nd, with different winners", () => {
    const second = loadDetail("1930-2nd");
    const third = loadDetail("1930-3rd");
    expect(second.ceremony.ordinal).toBe(2);
    expect(third.ceremony.ordinal).toBe(3);
    expect(second.ceremony.slug).not.toBe(third.ceremony.slug);
    expect(pictureWinner(second)).toBe("The Broadway Melody");
    expect(pictureWinner(third)).toBe("All Quiet on the Western Front");
  });

  it("41st ceremony (films of 1968): Best Actress is a tie", () => {
    const detail = loadDetail("1969");
    expect(detail.ceremony.ordinal).toBe(41);
    const names = categoryById(detail, "best-actress")?.winners.map(
      (entry) => entry.names[0],
    );
    expect(names).toEqual(["Katharine Hepburn", "Barbra Streisand"]);
  });

  it("92nd ceremony (2020): Parasite won Best Picture and the international label is current", () => {
    const detail = loadDetail("2020");
    expect(detail.ceremony.ordinal).toBe(92);
    expect(pictureWinner(detail)).toBe("Parasite");
    expect(categoryById(detail, "best-international-feature")?.label).toBe(
      "Best International Feature Film",
    );
  });

  it("96th ceremony (2024): Best Picture is Oppenheimer", () => {
    const detail = loadDetail("2024");
    expect(detail.ceremony.ordinal).toBe(96);
    expect(pictureWinner(detail)).toBe("Oppenheimer");
  });

  it("film year 1955 costume design still splits Color and Black and White", () => {
    const slug = ceremonyByFilmYear("1955")?.slug;
    expect(slug).toBeDefined();
    const detail = loadDetail(slug!);
    expect(categoryById(detail, "best-costume-design")?.label).toBe(
      "Best Costume Design (Color)",
    );
    expect(categoryById(detail, "best-costume-design-bw")?.label).toBe(
      "Best Costume Design (Black and White)",
    );
  });

  it("film year 2023 costume design has no color suffix", () => {
    const slug = ceremonyByFilmYear("2023")?.slug;
    expect(slug).toBeDefined();
    const detail = loadDetail(slug!);
    expect(categoryById(detail, "best-costume-design")?.label).toBe(
      "Best Costume Design",
    );
    expect(categoryById(detail, "best-costume-design-bw")).toBeUndefined();
  });

  /**
   * The Academy HTML carries no ids at all, so imdbId stays absent for these
   * editions and any tmdbId has to trace back to a committed films.json row.
   */
  it.each([
    { slug: "2025", ordinal: 97, filmYear: 2024 },
    { slug: "2026", ordinal: 98, filmYear: 2025 },
  ])(
    "$ordinal ceremony ($slug) comes from the official source, with its film id resolved through films.json",
    ({ slug, ordinal, filmYear }) => {
      const detail = loadDetail(slug);
      expect(detail.ceremony.ordinal).toBe(ordinal);
      const movie = categoryById(detail, "best-picture")?.winners[0]?.movies[0];
      expect(movie?.title).toBeTruthy();
      expect(movie?.imdbId).toBeUndefined();
      const resolved = loadFilms(DATA_DIR).find(
        (film) => film.title === movie?.title && film.filmYear === filmYear,
      );
      expect(movie?.tmdbId).toBe(resolved?.tmdbId);
    },
  );

  it("98th ceremony includes best-casting, which the historical feed does not have", () => {
    expect(categoryById(loadDetail("2026"), "best-casting")).toBeDefined();
    expect(categoryById(loadDetail("2025"), "best-casting")).toBeUndefined();
  });

  it("search.json has one Amélie film document, found by typing Amelie", () => {
    const films = loadSearch().filter(
      (doc) =>
        doc.kind === "film" &&
        normalizeSearchText(doc.title) === normalizeSearchText("Amelie"),
    );
    expect(films).toHaveLength(1);
    expect(films[0]?.title).toBe("Amélie");
    expect(films[0]?.slug).toBe("2002");
    expect(films[0]?.won).toBe(false);
  });
});
