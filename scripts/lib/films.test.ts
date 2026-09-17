import { describe, expect, it, vi } from "vitest";
import {
  attachFilmIds,
  collectFilmJobs,
  discoverFilms,
  filmMappingErrors,
  mergeFilms,
  normalizeTitle,
  pickFilmMatch,
} from "./films";
import type { CeremonyDetail, FilmLink } from "@/lib/schemas";

function detail(
  categories: {
    id: string;
    groupId: CeremonyDetail["groups"][number]["id"];
    title: string;
    tmdbId?: number;
    asNominee?: boolean;
  }[],
): CeremonyDetail {
  return {
    ceremony: {
      ordinal: 97,
      ceremonyYear: 2025,
      ceremonyDate: "2025-03-02",
      filmYearLabel: "2024",
      slug: "2025",
      decade: "2020s",
    },
    groups: categories.map((category) => {
      const entry = {
        names: ["A Winner"],
        movies: [
          {
            title: category.title,
            ...(category.tmdbId != null ? { tmdbId: category.tmdbId } : {}),
          },
        ],
      };
      return {
        id: category.groupId,
        label: "Group",
        categories: [
          {
            id: category.id,
            label: "Category",
            winners: category.asNominee
              ? [
                  {
                    names: ["Someone Else"],
                    movies: [{ title: "Filler", tmdbId: 42 }],
                  },
                ]
              : [entry],
            nominees: category.asNominee ? [entry] : [],
          },
        ],
      };
    }),
  };
}

describe("collectFilmJobs", () => {
  it("asks for the Best Picture and portrait winners' films only", () => {
    const jobs = collectFilmJobs([
      detail([
        { id: "best-picture", groupId: "headline", title: "Anora" },
        { id: "best-director", groupId: "headline", title: "Anora" },
        { id: "best-actress", groupId: "acting", title: "Ainda Estou Aqui" },
        { id: "best-original-score", groupId: "music", title: "The Brutalist" },
      ]),
    ]);
    expect(jobs.map((job) => job.title)).toEqual(["Anora", "Ainda Estou Aqui"]);
    expect(jobs[0]).toEqual({ title: "Anora", filmYear: 2024, slug: "2025" });
  });

  it("skips films that already carry a tmdb id and skips nominees", () => {
    const jobs = collectFilmJobs([
      detail([
        { id: "best-picture", groupId: "headline", title: "Anora", tmdbId: 1064213 },
        { id: "best-actor", groupId: "acting", title: "The Brutalist", asNominee: true },
      ]),
    ]);
    expect(jobs).toEqual([]);
  });
});

describe("normalizeTitle", () => {
  it("folds case, accents and punctuation", () => {
    expect(normalizeTitle("Emilia Pérez")).toBe(normalizeTitle("EMILIA PEREZ"));
    expect(normalizeTitle("I'm Still Here")).toBe(normalizeTitle("Im Still Here"));
    expect(normalizeTitle("One Battle after Another")).toBe(
      normalizeTitle("One Battle After Another"),
    );
  });
});

describe("pickFilmMatch", () => {
  it("does not accept a hit whose title is merely similar", () => {
    const match = pickFilmMatch(
      [{ id: 1, title: "Anora and Friends", release_date: "2024-10-18" }],
      "Anora",
      2024,
    );
    expect(match.status).toBe("none");
  });

  it("matches the original title when the Academy printed it", () => {
    const match = pickFilmMatch(
      [
        {
          id: 1,
          title: "I'm Still Here",
          original_title: "Ainda Estou Aqui",
          release_date: "2024-11-07",
        },
      ],
      "Ainda Estou Aqui",
      2024,
    );
    expect(match).toEqual({
      status: "one",
      matches: [
        {
          id: 1,
          title: "I'm Still Here",
          original_title: "Ainda Estou Aqui",
          release_date: "2024-11-07",
        },
      ],
    });
  });

  it("accepts the year after the film year but not two years out", () => {
    const late = pickFilmMatch(
      [{ id: 1, title: "A Film", release_date: "2025-01-10" }],
      "A Film",
      2024,
    );
    expect(late.status).toBe("one");
    const wrongEra = pickFilmMatch(
      [{ id: 1, title: "A Film", release_date: "1998-01-10" }],
      "A Film",
      2024,
    );
    expect(wrongEra.status).toBe("none");
  });

  it("aborts on a remake sharing the title and the year window", () => {
    const match = pickFilmMatch(
      [
        { id: 1, title: "A Film", release_date: "2024-03-01" },
        { id: 2, title: "A Film", release_date: "2025-03-01" },
      ],
      "A Film",
      2024,
    );
    expect(match.status).toBe("many");
  });
});

describe("mergeFilms", () => {
  it("keeps a hand-edited films.json entry instead of overwriting it", () => {
    const merged = mergeFilms(
      [{ title: "Anora", filmYear: 2024, tmdbId: 99, provenBy: "Hand edit" }],
      [{ title: "Anora", filmYear: 2024, tmdbId: 1, provenBy: "Anora (2024-10-18)" }],
    );
    expect(merged).toEqual([
      { title: "Anora", filmYear: 2024, tmdbId: 99, provenBy: "Hand edit" },
    ]);
  });

  it("treats a reused title from another film year as its own entry", () => {
    const merged = mergeFilms(
      [],
      [
        { title: "A Star Is Born", filmYear: 1937, tmdbId: 1, provenBy: "x" },
        { title: "A Star Is Born", filmYear: 2018, tmdbId: 2, provenBy: "y" },
      ],
    );
    expect(merged).toHaveLength(2);
    expect(filmMappingErrors(merged)).toEqual([]);
  });
});

describe("filmMappingErrors", () => {
  it("flags one title and year mapped to two ids", () => {
    expect(
      filmMappingErrors([
        { title: "Anora", filmYear: 2024, tmdbId: 1, provenBy: "x" },
        { title: "Anora", filmYear: 2024, tmdbId: 2, provenBy: "y" },
      ]).length,
    ).toBeGreaterThan(0);
  });
});

describe("attachFilmIds", () => {
  it("fills in missing ids and leaves existing ones alone", () => {
    const details = [
      detail([
        { id: "best-picture", groupId: "headline", title: "Anora" },
        { id: "best-director", groupId: "headline", title: "Wicked", tmdbId: 402431 },
      ]),
    ];
    attachFilmIds(details, [
      { title: "Anora", filmYear: 2024, tmdbId: 1064213, provenBy: "x" },
      { title: "Wicked", filmYear: 2024, tmdbId: 1, provenBy: "y" },
    ]);
    expect(details[0].groups[0].categories[0].winners[0].movies[0].tmdbId).toBe(
      1064213,
    );
    expect(details[0].groups[1].categories[0].winners[0].movies[0].tmdbId).toBe(
      402431,
    );
  });

  it("does not attach an id resolved for a different film year", () => {
    const details = [
      detail([{ id: "best-picture", groupId: "headline", title: "A Star Is Born" }]),
    ];
    attachFilmIds(details, [
      { title: "A Star Is Born", filmYear: 1937, tmdbId: 1, provenBy: "x" },
    ]);
    expect(
      details[0].groups[0].categories[0].winners[0].movies[0].tmdbId,
    ).toBeUndefined();
  });
});

describe("discoverFilms", () => {
  it("does not re-resolve a title already in films.json, including nulls", async () => {
    const fetchFn = vi.fn();
    const existing: FilmLink[] = [
      { title: "Anora", filmYear: 2024, tmdbId: 1064213, provenBy: "x" },
      { title: "Nickel Boys", filmYear: 2024, tmdbId: null, provenBy: "search 2024" },
    ];
    const discovered = await discoverFilms(
      [
        { title: "Anora", filmYear: 2024, slug: "2025" },
        { title: "Nickel Boys", filmYear: 2024, slug: "2025" },
      ],
      existing,
      { apiKey: "k", fetchFn: fetchFn as unknown as typeof fetch },
    );
    expect(discovered).toEqual([]);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("records tmdbId null when nothing matches, so the run is not retried blindly", async () => {
    const log = vi.fn();
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({ results: [] }),
    }));
    const discovered = await discoverFilms(
      [{ title: "A Lost Short", filmYear: 1932, slug: "1932" }],
      [],
      { apiKey: "k", fetchFn: fetchFn as unknown as typeof fetch, log },
    );
    expect(discovered).toEqual([
      {
        title: "A Lost Short",
        filmYear: 1932,
        tmdbId: null,
        provenBy: "search 1932",
      },
    ]);
  });

  it("records the matched title and release date as provenance", async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        results: [{ id: 1064213, title: "Anora", release_date: "2024-10-18" }],
      }),
    }));
    const discovered = await discoverFilms(
      [{ title: "Anora", filmYear: 2024, slug: "2025" }],
      [],
      { apiKey: "k", fetchFn: fetchFn as unknown as typeof fetch },
    );
    expect(discovered).toEqual([
      {
        title: "Anora",
        filmYear: 2024,
        tmdbId: 1064213,
        provenBy: "Anora (2024-10-18)",
      },
    ]);
  });

  it("writes no id when two candidates survive, and says so", async () => {
    const log = vi.fn();
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        results: [
          { id: 1, title: "A Film", release_date: "2024-03-01" },
          { id: 2, title: "A Film", release_date: "2024-09-01" },
        ],
      }),
    }));
    const discovered = await discoverFilms(
      [{ title: "A Film", filmYear: 2024, slug: "2025" }],
      [],
      { apiKey: "k", fetchFn: fetchFn as unknown as typeof fetch, log },
    );
    expect(discovered).toEqual([]);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/TMDB 1.*TMDB 2/));
  });

  it("keeps going when one search fails", async () => {
    const log = vi.fn();
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("Broken")) {
        return { ok: false, status: 500, json: async () => ({}) };
      }
      return {
        ok: true,
        json: async () => ({
          results: [{ id: 7, title: "Fine", release_date: "2024-05-01" }],
        }),
      };
    });
    const discovered = await discoverFilms(
      [
        { title: "Broken", filmYear: 2024, slug: "2025" },
        { title: "Fine", filmYear: 2024, slug: "2025" },
      ],
      [],
      { apiKey: "k", fetchFn: fetchFn as unknown as typeof fetch, log },
    );
    expect(discovered.map((film) => film.tmdbId)).toEqual([7]);
    expect(log).toHaveBeenCalledWith(expect.stringMatching(/Broken/));
  });
});
