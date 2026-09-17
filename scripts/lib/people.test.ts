import { describe, expect, it, vi } from "vitest";
import {
  attachWinnerPortraits,
  collectPortraitJobs,
  discoverPeople,
  mergePeople,
  peopleMappingErrors,
  pickCreditMatch,
  strayPortraitPaths,
} from "./people";
import type { CeremonyDetail, PersonLink } from "@/lib/schemas";

function actingDetail(args: {
  name: string;
  movieTitle: string;
  movieTmdbId?: number;
  categoryId?: string;
}): CeremonyDetail {
  return {
    ceremony: {
      ordinal: 96,
      ceremonyYear: 2024,
      ceremonyDate: "2024-03-10",
      filmYearLabel: "2023",
      slug: "2024",
      decade: "2020s",
    },
    groups: [
      {
        id: "acting",
        label: "Acting",
        categories: [
          {
            id: args.categoryId ?? "best-actor",
            label: "Best Actor",
            winners: [
              {
                names: [args.name],
                movies: [
                  {
                    title: args.movieTitle,
                    ...(args.movieTmdbId != null
                      ? { tmdbId: args.movieTmdbId }
                      : {}),
                  },
                ],
              },
            ],
            nominees: [],
          },
        ],
      },
    ],
  };
}

describe("pickCreditMatch", () => {
  it("does not produce an id without a credit match", () => {
    const result = pickCreditMatch(
      [{ id: 9, name: "A Body Double" }],
      new Set([1, 2]),
    );
    expect(result.status).toBe("none");
  });

  it("does not resolve a homonym to the uncredited candidate", () => {
    const result = pickCreditMatch(
      [
        { id: 1, name: "John Williams" },
        { id: 2, name: "John Williams" },
      ],
      new Set([1]),
    );
    expect(result).toEqual({
      status: "one",
      matches: [{ id: 1, name: "John Williams" }],
    });
  });

  it("aborts when two credited candidates share the name", () => {
    const result = pickCreditMatch(
      [
        { id: 1, name: "John Williams" },
        { id: 2, name: "John Williams" },
      ],
      new Set([1, 2]),
    );
    expect(result.status).toBe("many");
  });
});

describe("mergePeople", () => {
  it("keeps a hand-edited people.json entry instead of overwriting it", () => {
    const merged = mergePeople(
      [{ name: "Cillian Murphy", tmdbId: 99, provenBy: "Hand edit" }],
      [{ name: "Cillian Murphy", tmdbId: 1, provenBy: "Oppenheimer" }],
    );
    expect(merged).toEqual([
      { name: "Cillian Murphy", tmdbId: 99, provenBy: "Hand edit" },
    ]);
  });
});

describe("discoverPeople", () => {
  it("does not re-resolve a name that is already in people.json, including nulls", async () => {
    const fetchFn = vi.fn();
    const existing: PersonLink[] = [
      { name: "Known Actor", tmdbId: 4, provenBy: "A Film" },
      { name: "Unresolved Extra", tmdbId: null, provenBy: "A Film" },
    ];
    const discovered = await discoverPeople(
      [
        { name: "Known Actor", movieTitle: "A Film", movieTmdbId: 10 },
        { name: "Unresolved Extra", movieTitle: "A Film", movieTmdbId: 10 },
      ],
      existing,
      { apiKey: "k", fetchFn: fetchFn as unknown as typeof fetch },
    );
    expect(discovered).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("records tmdbId null when search hits are not in the film credits", async () => {
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/search/person")) {
        return {
          ok: true,
          json: async () => ({ results: [{ id: 9, name: "Nobody Famous" }] }),
        };
      }
      return {
        ok: true,
        json: async () => ({ cast: [{ id: 1 }], crew: [] }),
      };
    });
    const discovered = await discoverPeople(
      [{ name: "Nobody Famous", movieTitle: "Wings", movieTmdbId: 28966 }],
      [],
      { apiKey: "k", fetchFn: fetchFn as unknown as typeof fetch },
    );
    expect(discovered).toEqual([
      { name: "Nobody Famous", tmdbId: null, provenBy: "Wings" },
    ]);
  });

  it("does not write an id when several credited candidates share the name", async () => {
    const log = vi.fn();
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/search/person")) {
        return {
          ok: true,
          json: async () => ({
            results: [
              { id: 1, name: "John Williams" },
              { id: 2, name: "John Williams" },
            ],
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ cast: [], crew: [{ id: 1 }, { id: 2 }] }),
      };
    });
    const discovered = await discoverPeople(
      [{ name: "John Williams", movieTitle: "Star Wars", movieTmdbId: 11 }],
      [],
      { apiKey: "k", fetchFn: fetchFn as unknown as typeof fetch, log },
    );
    expect(discovered).toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/TMDB 1.*TMDB 2/));
  });
});

describe("collectPortraitJobs", () => {
  it("skips winners whose film has no tmdb id", () => {
    const jobs = collectPortraitJobs([
      actingDetail({ name: "Adrien Brody", movieTitle: "The Brutalist" }),
      actingDetail({
        name: "Cillian Murphy",
        movieTitle: "Oppenheimer",
        movieTmdbId: 872585,
      }),
    ]);
    expect(jobs).toEqual([
      {
        name: "Cillian Murphy",
        movieTitle: "Oppenheimer",
        movieTmdbId: 872585,
      },
    ]);
  });
});

describe("peopleMappingErrors", () => {
  it("rejects a name mapped to two ids or an id mapped to two names", () => {
    expect(
      peopleMappingErrors([
        { name: "A", tmdbId: 1, provenBy: "x" },
        { name: "A", tmdbId: 2, provenBy: "y" },
      ]).length,
    ).toBeGreaterThan(0);
    expect(
      peopleMappingErrors([
        { name: "A", tmdbId: 1, provenBy: "x" },
        { name: "B", tmdbId: 1, provenBy: "y" },
      ]).length,
    ).toBeGreaterThan(0);
  });

  it("accepts a declared alias sharing the canonical id", () => {
    expect(
      peopleMappingErrors([
        { name: "A", tmdbId: 1, provenBy: "x" },
        { name: "A. Variant", tmdbId: 1, provenBy: "y", aliasOf: "A" },
      ]),
    ).toEqual([]);
  });

  it("rejects an alias of an unlisted name, of a different id, or of another alias", () => {
    expect(
      peopleMappingErrors([
        { name: "A", tmdbId: 1, provenBy: "x", aliasOf: "Nobody" },
      ]).length,
    ).toBeGreaterThan(0);
    expect(
      peopleMappingErrors([
        { name: "A", tmdbId: 1, provenBy: "x" },
        { name: "B", tmdbId: 2, provenBy: "y", aliasOf: "A" },
      ]).length,
    ).toBeGreaterThan(0);
    expect(
      peopleMappingErrors([
        { name: "A", tmdbId: 1, provenBy: "x" },
        { name: "B", tmdbId: 1, provenBy: "y", aliasOf: "A" },
        { name: "C", tmdbId: 1, provenBy: "z", aliasOf: "B" },
      ]).length,
    ).toBeGreaterThan(0);
  });
});

describe("strayPortraitPaths", () => {
  it("flags portraitPath outside directing and acting winners", () => {
    const detail = actingDetail({
      name: "A Composer",
      movieTitle: "A Score",
      movieTmdbId: 1,
      categoryId: "best-original-score",
    });
    detail.groups[0].id = "music";
    detail.groups[0].categories[0].id = "best-original-score";
    detail.groups[0].categories[0].winners[0].portraitPath = "/images/people/1.webp";
    expect(strayPortraitPaths([detail]).length).toBeGreaterThan(0);
  });
});

describe("attachWinnerPortraits", () => {
  it("sets portraitPath only for directing and acting winners whose file exists", () => {
    const details = [
      actingDetail({
        name: "Cillian Murphy",
        movieTitle: "Oppenheimer",
        movieTmdbId: 872585,
      }),
    ];
    attachWinnerPortraits(
      details,
      [{ name: "Cillian Murphy", tmdbId: 2037, provenBy: "Oppenheimer" }],
      (relative) => relative === "people/2037.webp",
    );
    expect(details[0].groups[0].categories[0].winners[0].portraitPath).toBe(
      "/images/people/2037.webp",
    );

    attachWinnerPortraits(
      details,
      [{ name: "Cillian Murphy", tmdbId: 2037, provenBy: "Oppenheimer" }],
      () => false,
    );
    expect(
      details[0].groups[0].categories[0].winners[0].portraitPath,
    ).toBeUndefined();
  });
});
