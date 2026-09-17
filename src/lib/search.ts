import type { SearchDoc, SearchKind } from "./schemas";

/**
 * Query-time folding for the search index (spec.md 9): accents and case
 * drop away so "Amelie" matches "Amélie".
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

export const SEARCH_GROUP_LIMIT = 8;

export const SEARCH_GROUP_ORDER: SearchKind[] = ["year", "film", "person"];

export const SEARCH_GROUP_LABELS: Record<SearchKind, string> = {
  year: "Years",
  film: "Films",
  person: "People",
};

export type SearchGroup = {
  kind: SearchKind;
  label: string;
  docs: SearchDoc[];
};

export function filterSearchDocs(docs: SearchDoc[], query: string): SearchDoc[] {
  const needle = normalizeSearchText(query);
  if (needle.length === 0) return [];

  const scored: { doc: SearchDoc; idx: number; len: number }[] = [];
  for (const doc of docs) {
    const haystack = normalizeSearchText(doc.title);
    const idx = haystack.indexOf(needle);
    if (idx === -1) continue;
    scored.push({ doc, idx, len: haystack.length });
  }

  scored.sort(
    (a, b) =>
      a.idx - b.idx ||
      a.len - b.len ||
      a.doc.title.localeCompare(b.doc.title, "en"),
  );
  return scored.map((item) => item.doc);
}

export function groupSearchDocs(
  docs: SearchDoc[],
  limit = SEARCH_GROUP_LIMIT,
): SearchGroup[] {
  return SEARCH_GROUP_ORDER.map((kind) => ({
    kind,
    label: SEARCH_GROUP_LABELS[kind],
    docs: docs.filter((doc) => doc.kind === kind).slice(0, limit),
  })).filter((group) => group.docs.length > 0);
}
