import { describe, expect, it, vi } from "vitest";
import {
  applyEnvFile,
  downloadBestPicturePosters,
  downloadPersonPortraits,
  loadTmdbApiKey,
  withRetries,
} from "./fetch-images";
import { attachBestPicturePosters, collectPosterJobs } from "./lib/posters";
import type { CeremonyDetail } from "@/lib/schemas";

function detail(overrides: {
  slug: string;
  tmdbId?: number;
  title?: string;
}): CeremonyDetail {
  const movie = {
    title: overrides.title ?? "A Film",
    ...(overrides.tmdbId != null ? { tmdbId: overrides.tmdbId } : {}),
  };
  return {
    ceremony: {
      ordinal: 96,
      ceremonyYear: 2024,
      ceremonyDate: "2024-03-10",
      filmYearLabel: "2023",
      slug: overrides.slug,
      decade: "2020s",
    },
    groups: [
      {
        id: "headline",
        label: "The Big Two",
        categories: [
          {
            id: "best-picture",
            label: "Best Picture",
            winners: [{ names: [movie.title], movies: [movie] }],
            nominees: [],
          },
        ],
      },
    ],
  };
}

describe("collectPosterJobs", () => {
  it("skips editions that have no tmdb id", () => {
    const jobs = collectPosterJobs([
      detail({ slug: "2026" }),
      detail({ slug: "2024", tmdbId: 872585, title: "Oppenheimer" }),
    ]);
    expect(jobs).toEqual([
      { slug: "2024", title: "Oppenheimer", tmdbId: 872585 },
    ]);
  });
});

describe("attachBestPicturePosters", () => {
  it("sets posterPath only when the file exists on disk", () => {
    const details = [
      detail({ slug: "2024", tmdbId: 872585, title: "Oppenheimer" }),
      detail({ slug: "2026" }),
    ];
    attachBestPicturePosters(
      details,
      (relative) => relative === "posters/872585.webp",
    );
    expect(details[0].groups[0].categories[0].winners[0].movies[0].posterPath).toBe(
      "/images/posters/872585.webp",
    );
    expect(details[1].groups[0].categories[0].winners[0].movies[0].posterPath).toBeUndefined();
  });
});

describe("loadTmdbApiKey", () => {
  it("aborts when the key is missing", () => {
    expect(() => loadTmdbApiKey({})).toThrow(/TMDB_API_KEY/);
  });
});

describe("applyEnvFile", () => {
  it("is a no-op when the file is absent", () => {
    const env: NodeJS.ProcessEnv = {};
    applyEnvFile("C:\\definitely-missing.env.local", env);
    expect(env.TMDB_API_KEY).toBeUndefined();
  });
});

describe("withRetries", () => {
  it("retries then returns the successful attempt", async () => {
    const sleep = vi.fn(async () => undefined);
    let calls = 0;
    const value = await withRetries(
      async () => {
        calls += 1;
        if (calls < 3) throw new Error("nope");
        return "ok";
      },
      { sleep, delaysMs: [1, 1, 1] },
    );
    expect(value).toBe("ok");
    expect(calls).toBe(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});

describe("downloadBestPicturePosters", () => {
  it("does not re-download a poster that already exists", async () => {
    const fetchFn = vi.fn();
    const writeFileFn = vi.fn();
    const report = await downloadBestPicturePosters({
      apiKey: "test-key",
      jobs: [{ slug: "2024", title: "Oppenheimer", tmdbId: 872585 }],
      imagesDir: "/tmp/images",
      budgetBytes: 4 * 1024 * 1024,
      fetchFn: fetchFn as unknown as typeof fetch,
      encodeWebp: async (bytes) => bytes,
      exists: () => true,
      writeFileFn,
      ensureDir: async () => undefined,
      dirSize: () => 0,
    });
    expect(report.skippedExisting).toBe(1);
    expect(report.downloaded).toBe(0);
    expect(fetchFn).not.toHaveBeenCalled();
    expect(writeFileFn).not.toHaveBeenCalled();
  });

  it("omits a failed download without aborting the rest", async () => {
    const written: string[] = [];
    const fetchFn = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/movie/1")) {
        throw new Error("network down");
      }
      if (url.includes("/movie/2")) {
        return {
          ok: true,
          json: async () => ({ poster_path: "/x.jpg" }),
        };
      }
      return {
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      };
    });
    const report = await downloadBestPicturePosters({
      apiKey: "test-key",
      jobs: [
        { slug: "1929", title: "Wings", tmdbId: 1 },
        { slug: "2024", title: "Oppenheimer", tmdbId: 2 },
      ],
      imagesDir: "/tmp/images",
      budgetBytes: 4 * 1024 * 1024,
      fetchFn: fetchFn as unknown as typeof fetch,
      encodeWebp: async (bytes) => bytes,
      exists: () => false,
      writeFileFn: async (filePath) => {
        written.push(filePath);
      },
      ensureDir: async () => undefined,
      dirSize: () => 0,
      sleep: async () => undefined,
      log: () => undefined,
    });
    expect(report.failed).toBe(1);
    expect(report.downloaded).toBe(1);
    expect(written.some((file) => file.endsWith("2.webp"))).toBe(true);
  });
});

describe("downloadPersonPortraits", () => {
  it("skips a resolved person who has no TMDB profile photo", async () => {
    const fetchFn = vi.fn(async () => ({
      ok: true,
      json: async () => ({ profile_path: null }),
    }));
    const writeFileFn = vi.fn();
    const report = await downloadPersonPortraits({
      apiKey: "test-key",
      people: [{ name: "Cillian Murphy", tmdbId: 2037, provenBy: "Oppenheimer" }],
      imagesDir: "/tmp/images",
      budgetBytes: 4 * 1024 * 1024,
      fetchFn: fetchFn as unknown as typeof fetch,
      encodeWebp: async (bytes) => bytes,
      exists: () => false,
      writeFileFn,
      ensureDir: async () => undefined,
      dirSize: () => 0,
      log: () => undefined,
    });
    expect(report.skipped).toBe(1);
    expect(report.downloaded).toBe(0);
    expect(writeFileFn).not.toHaveBeenCalled();
  });

  it("does not download a portrait that is already on disk", async () => {
    const fetchFn = vi.fn();
    const report = await downloadPersonPortraits({
      apiKey: "test-key",
      people: [{ name: "Cillian Murphy", tmdbId: 2037, provenBy: "Oppenheimer" }],
      imagesDir: "/tmp/images",
      budgetBytes: 4 * 1024 * 1024,
      fetchFn: fetchFn as unknown as typeof fetch,
      encodeWebp: async (bytes) => bytes,
      exists: () => true,
      writeFileFn: vi.fn(),
      ensureDir: async () => undefined,
      dirSize: () => 0,
    });
    expect(report.skippedExisting).toBe(1);
    expect(fetchFn).not.toHaveBeenCalled();
  });
});
