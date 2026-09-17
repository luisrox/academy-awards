import type { SearchDoc } from "@/lib/types";

export const SEARCH_INDEX_URL = "/search.json";

let cache: SearchDoc[] | null = null;

export function clearSearchIndexCache(): void {
  cache = null;
}

/**
 * Client-side loader for the search index. The JSON is fetched only when
 * search opens; it must never be statically imported into a client module.
 */
export async function fetchSearchIndex(
  fetcher: typeof fetch = fetch,
): Promise<SearchDoc[]> {
  if (cache) return cache;
  const response = await fetcher(SEARCH_INDEX_URL);
  if (!response.ok) {
    throw new Error(`search index failed (${response.status})`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("search.json: expected an array");
  }
  cache = data as SearchDoc[];
  return cache;
}