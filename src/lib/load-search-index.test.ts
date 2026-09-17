import { afterEach, describe, expect, it, vi } from "vitest";
import type { SearchDoc } from "@/lib/types";
import {
  SEARCH_INDEX_URL,
  clearSearchIndexCache,
  fetchSearchIndex,
} from "./load-search-index";

const index: SearchDoc[] = [
  {
    slug: "2020",
    label: "Parasite",
    kind: "film",
    title: "Parasite",
    detail: "2020",
    won: true,
  },
];

afterEach(() => {
  clearSearchIndexCache();
});

describe("fetchSearchIndex", () => {
  it("loads /search.json through the given fetcher and caches the result", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => index,
    });

    const first = await fetchSearchIndex(fetcher);
    const second = await fetchSearchIndex(fetcher);

    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith(SEARCH_INDEX_URL);
    expect(first).toEqual(index);
    expect(second).toBe(first);
  });

  it("does not cache a failed load so retry can try again", async () => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => null })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => index,
      });

    await expect(fetchSearchIndex(fetcher)).rejects.toThrow(/search index/i);
    await expect(fetchSearchIndex(fetcher)).resolves.toEqual(index);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
