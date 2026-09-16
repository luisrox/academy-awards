import { describe, expect, it } from "vitest";
import {
  buildCeremonyDetails,
  buildGridEntries,
} from "./build-details";
import type { NominationRecord } from "./load-historical";

function rec(
  overrides: Partial<NominationRecord> &
    Pick<NominationRecord, "ordinal" | "categoryId">,
): NominationRecord {
  return {
    categoryLabel: overrides.categoryLabel ?? overrides.categoryId,
    names: overrides.names ?? ["Nominee"],
    movies: overrides.movies ?? [{ title: "A Film" }],
    won: overrides.won ?? false,
    ...overrides,
  };
}

const picture = rec({
  ordinal: 96,
  categoryId: "best-picture",
  categoryLabel: "Best Picture",
  names: ["Oppenheimer"],
  movies: [{ title: "Oppenheimer" }],
  won: true,
});

describe("buildCeremonyDetails", () => {
  it("orders groups and categories to match the dictionary", () => {
    const details = buildCeremonyDetails([
      rec({
        ordinal: 96,
        categoryId: "best-actress",
        categoryLabel: "Best Actress",
        names: ["Emma Stone"],
        movies: [{ title: "Poor Things" }],
        won: true,
      }),
      rec({
        ordinal: 96,
        categoryId: "best-animated-feature",
        categoryLabel: "Best Animated Feature",
        names: ["The Boy and the Heron"],
        won: true,
      }),
      rec({
        ordinal: 96,
        categoryId: "best-actor",
        categoryLabel: "Best Actor",
        names: ["Cillian Murphy"],
        movies: [{ title: "Oppenheimer" }],
        won: true,
      }),
      rec({
        ordinal: 96,
        categoryId: "best-director",
        categoryLabel: "Best Director",
        names: ["Christopher Nolan"],
        movies: [{ title: "Oppenheimer" }],
        won: true,
      }),
      picture,
    ]);

    expect(details).toHaveLength(1);
    expect(details[0].groups.map((group) => group.id)).toEqual([
      "headline",
      "acting",
      "feature",
    ]);
    expect(details[0].groups[0].categories.map((c) => c.id)).toEqual([
      "best-picture",
      "best-director",
    ]);
    expect(details[0].groups[1].categories.map((c) => c.id)).toEqual([
      "best-actor",
      "best-actress",
    ]);
  });

  it("omits empty groups (a 1935-style edition has no Features block)", () => {
    const details = buildCeremonyDetails([
      rec({
        ordinal: 8,
        categoryId: "best-picture",
        categoryLabel: "Best Picture",
        names: ["Mutiny on the Bounty"],
        won: true,
      }),
      rec({
        ordinal: 8,
        categoryId: "best-actor",
        categoryLabel: "Best Actor",
        names: ["Victor McLaglen"],
        won: true,
      }),
    ]);

    expect(details[0].ceremony.filmYearLabel).toBe("1935");
    expect(details[0].groups.map((group) => group.id)).toEqual([
      "headline",
      "acting",
    ]);
    expect(details[0].groups.some((group) => group.id === "feature")).toBe(
      false,
    );
  });

  it("puts every winner of a tie into winners", () => {
    const details = buildCeremonyDetails([
      picture,
      rec({
        ordinal: 96,
        categoryId: "best-actress",
        categoryLabel: "Best Actress",
        names: ["Katharine Hepburn"],
        movies: [{ title: "The Lion in Winter" }],
        won: true,
      }),
      rec({
        ordinal: 96,
        categoryId: "best-actress",
        categoryLabel: "Best Actress",
        names: ["Barbra Streisand"],
        movies: [{ title: "Funny Girl" }],
        won: true,
      }),
    ]);
    const actress = details[0].groups
      .flatMap((group) => group.categories)
      .find((category) => category.id === "best-actress");
    expect(actress?.winners).toHaveLength(2);
    expect(actress?.winners.map((entry) => entry.names[0])).toEqual([
      "Katharine Hepburn",
      "Barbra Streisand",
    ]);
  });

  it("keeps both names on a shared nomination", () => {
    const details = buildCeremonyDetails([
      picture,
      rec({
        ordinal: 96,
        categoryId: "best-original-screenplay",
        categoryLabel: "Best Original Screenplay",
        names: ["Justine Triet", "Arthur Harari"],
        movies: [{ title: "Anatomy of a Fall" }],
        won: true,
      }),
    ]);
    const writing = details[0].groups
      .flatMap((group) => group.categories)
      .find((category) => category.id === "best-original-screenplay");
    expect(writing?.winners[0].names).toEqual([
      "Justine Triet",
      "Arthur Harari",
    ]);
  });

  it("allows a nomination with no movie", () => {
    const details = buildCeremonyDetails([
      picture,
      rec({
        ordinal: 96,
        categoryId: "best-documentary-feature",
        categoryLabel: "Best Documentary Feature Film",
        names: ["A TV Program"],
        movies: [],
        won: true,
      }),
    ]);
    const documentary = details[0].groups
      .flatMap((group) => group.categories)
      .find((category) => category.id === "best-documentary-feature");
    expect(documentary?.winners[0].movies).toEqual([]);
  });

  it("fails when a ceremony has no Best Picture winner", () => {
    expect(() =>
      buildCeremonyDetails([
        rec({
          ordinal: 96,
          categoryId: "best-director",
          categoryLabel: "Best Director",
          names: ["Christopher Nolan"],
          won: true,
        }),
      ]),
    ).toThrow(/Best Picture winner/);
  });
});

describe("buildGridEntries", () => {
  it("omits missing headline categories without leaving a hole", () => {
    const details = buildCeremonyDetails([
      rec({
        ordinal: 1,
        categoryId: "best-picture",
        categoryLabel: "Best Picture",
        names: ["Wings"],
        movies: [{ title: "Wings" }],
        won: true,
      }),
      rec({
        ordinal: 1,
        categoryId: "best-director",
        categoryLabel: "Best Director",
        names: ["Frank Borzage"],
        movies: [{ title: "7th Heaven" }],
        won: true,
      }),
      rec({
        ordinal: 1,
        categoryId: "best-actor",
        categoryLabel: "Best Actor",
        names: ["Emil Jannings"],
        movies: [{ title: "The Last Command" }],
        won: true,
      }),
    ]);
    const [entry] = buildGridEntries(details);
    expect(entry.headline.length).toBeLessThan(4);
    expect(entry.headline.map((item) => item.category)).toEqual([
      "Best Picture",
      "Best Director",
      "Best Actor",
    ]);
    for (const item of entry.headline) {
      expect(item.winner.length).toBeGreaterThan(0);
      expect(item.category.length).toBeGreaterThan(0);
    }
  });
});
