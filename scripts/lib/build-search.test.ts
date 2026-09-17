import { describe, expect, it } from "vitest";
import type { CeremonyDetail } from "@/lib/types";
import { normalizeSearchText } from "@/lib/search";
import { buildSearchIndex } from "./build-search";

function detail(overrides: {
  slug: string;
  ceremonyYear: number;
  ordinal: number;
  filmYearLabel?: string;
  groups: CeremonyDetail["groups"];
}): CeremonyDetail {
  return {
    ceremony: {
      ordinal: overrides.ordinal,
      ceremonyYear: overrides.ceremonyYear,
      ceremonyDate: `${overrides.ceremonyYear}-03-01`,
      filmYearLabel: overrides.filmYearLabel ?? String(overrides.ceremonyYear - 1),
      slug: overrides.slug,
      decade: `${Math.floor(overrides.ceremonyYear / 10) * 10}s`,
    },
    groups: overrides.groups,
  };
}

const amelieCeremony = detail({
  slug: "2002",
  ceremonyYear: 2002,
  ordinal: 74,
  groups: [
    {
      id: "headline",
      label: "The Big Two",
      categories: [
        {
          id: "best-picture",
          label: "Best Picture",
          winners: [
            { names: ["A Beautiful Mind"], movies: [{ title: "A Beautiful Mind" }] },
          ],
          nominees: [
            { names: ["Amélie"], movies: [{ title: "Amélie" }] },
            { names: ["Gosford Park"], movies: [{ title: "Gosford Park" }] },
          ],
        },
        {
          id: "best-director",
          label: "Best Director",
          winners: [
            {
              names: ["Ron Howard"],
              movies: [{ title: "A Beautiful Mind" }],
            },
          ],
          nominees: [
            {
              names: ["Jean-Pierre Jeunet"],
              movies: [{ title: "Amélie" }],
            },
          ],
        },
      ],
    },
    {
      id: "craft",
      label: "Crafts",
      categories: [
        {
          id: "best-cinematography",
          label: "Best Cinematography",
          winners: [
            {
              names: ["Andrew Lesnie"],
              movies: [{ title: "The Lord of the Rings: The Fellowship of the Ring" }],
            },
          ],
          nominees: [
            {
              names: ["Bruno Delbonnel"],
              movies: [{ title: "Amélie" }],
            },
          ],
        },
      ],
    },
  ],
});

describe("normalizeSearchText", () => {
  it("finds an accented title when typed without accents or capitals", () => {
    const title = "Amélie";
    expect(normalizeSearchText("Amelie")).toBe(normalizeSearchText(title));
    expect(normalizeSearchText("AMÉLIE")).toBe(normalizeSearchText(title));
  });
});

describe("buildSearchIndex", () => {
  it("emits year, film, and person documents", () => {
    const docs = buildSearchIndex([amelieCeremony]);
    expect(docs.some((doc) => doc.kind === "year")).toBe(true);
    expect(docs.some((doc) => doc.kind === "film")).toBe(true);
    expect(docs.some((doc) => doc.kind === "person")).toBe(true);
  });

  it("does not emit one film document per nomination of the same movie", () => {
    const films = buildSearchIndex([amelieCeremony]).filter(
      (doc) => doc.kind === "film" && doc.title === "Amélie",
    );
    expect(films).toHaveLength(1);
    expect(films[0]?.slug).toBe("2002");
    expect(films[0]?.won).toBe(false);
  });

  it("does not treat a Best Picture title as a person", () => {
    const people = buildSearchIndex([amelieCeremony]).filter(
      (doc) => doc.kind === "person",
    );
    expect(people.map((doc) => doc.title)).not.toContain("Amélie");
    expect(people.map((doc) => doc.title)).toContain("Jean-Pierre Jeunet");
  });

  it("marks a winning film as won even if it was also nominated elsewhere", () => {
    const films = buildSearchIndex([amelieCeremony]).filter(
      (doc) => doc.kind === "film" && doc.title === "A Beautiful Mind",
    );
    expect(films).toHaveLength(1);
    expect(films[0]?.won).toBe(true);
  });

  it("keeps two ceremonies for the same year as distinct year documents", () => {
    const second = detail({
      slug: "1930-2nd",
      ceremonyYear: 1930,
      ordinal: 2,
      filmYearLabel: "1928/29",
      groups: [
        {
          id: "headline",
          label: "The Big Two",
          categories: [
            {
              id: "best-picture",
              label: "Best Picture",
              winners: [
                {
                  names: ["The Broadway Melody"],
                  movies: [{ title: "The Broadway Melody" }],
                },
              ],
              nominees: [],
            },
          ],
        },
      ],
    });
    const third = detail({
      slug: "1930-3rd",
      ceremonyYear: 1930,
      ordinal: 3,
      filmYearLabel: "1929/30",
      groups: [
        {
          id: "headline",
          label: "The Big Two",
          categories: [
            {
              id: "best-picture",
              label: "Best Picture",
              winners: [
                {
                  names: ["All Quiet on the Western Front"],
                  movies: [{ title: "All Quiet on the Western Front" }],
                },
              ],
              nominees: [],
            },
          ],
        },
      ],
    });
    const years = buildSearchIndex([second, third]).filter(
      (doc) => doc.kind === "year",
    );
    expect(years).toHaveLength(2);
    expect(years.map((doc) => doc.slug).sort()).toEqual([
      "1930-2nd",
      "1930-3rd",
    ]);
  });

  it("points every document at a slug from the source details", () => {
    const docs = buildSearchIndex([amelieCeremony]);
    expect(docs.length).toBeGreaterThan(0);
    expect(docs.every((doc) => doc.slug === "2002")).toBe(true);
  });
});
