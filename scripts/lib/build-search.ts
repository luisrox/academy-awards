import { ceremonySubtitle } from "@/data/ceremonies";
import { normalizeSearchText } from "@/lib/search";
import type { CeremonyDetail, Entry, SearchDoc } from "@/lib/types";

function movieTitles(entry: Entry): string[] {
  return entry.movies.map((movie) => movie.title).filter((title) => title.length > 0);
}

/** Names that are not the film title in this entry — people, studios, songs. */
function personNames(entry: Entry): string[] {
  const films = new Set(movieTitles(entry));
  return entry.names.filter((name) => name.length > 0 && !films.has(name));
}

function upsert(
  docs: Map<string, SearchDoc>,
  kind: SearchDoc["kind"],
  title: string,
  slug: string,
  detail: string,
  won: boolean,
): void {
  const key = `${kind}:${slug}:${normalizeSearchText(title)}`;
  const existing = docs.get(key);
  if (existing) {
    if (won) existing.won = true;
    return;
  }
  docs.set(key, { slug, label: title, kind, title, detail, won });
}

/**
 * Flatten ceremony details into search documents. A film or person nominated
 * in several categories of the same edition becomes a single document.
 */
export function buildSearchIndex(details: CeremonyDetail[]): SearchDoc[] {
  const docs = new Map<string, SearchDoc>();
  const newestFirst = [...details].sort(
    (a, b) => b.ceremony.ordinal - a.ceremony.ordinal,
  );

  for (const item of newestFirst) {
    const { ceremony } = item;
    const year = String(ceremony.ceremonyYear);
    upsert(docs, "year", year, ceremony.slug, ceremonySubtitle(ceremony), false);

    for (const group of item.groups) {
      for (const category of group.categories) {
        for (const entry of category.winners) {
          for (const title of movieTitles(entry)) {
            upsert(docs, "film", title, ceremony.slug, year, true);
          }
          for (const name of personNames(entry)) {
            upsert(docs, "person", name, ceremony.slug, year, true);
          }
        }
        for (const entry of category.nominees) {
          for (const title of movieTitles(entry)) {
            upsert(docs, "film", title, ceremony.slug, year, false);
          }
          for (const name of personNames(entry)) {
            upsert(docs, "person", name, ceremony.slug, year, false);
          }
        }
      }
    }
  }

  const rank: Record<SearchDoc["kind"], number> = { year: 0, film: 1, person: 2 };
  return [...docs.values()].sort((a, b) => {
    if (a.kind !== b.kind) return rank[a.kind] - rank[b.kind];
    const byTitle = a.title.localeCompare(b.title, "en");
    if (byTitle !== 0) return byTitle;
    return a.slug.localeCompare(b.slug);
  });
}
