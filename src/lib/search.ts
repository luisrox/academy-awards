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
