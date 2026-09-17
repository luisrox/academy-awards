import {
  CATEGORIES,
  CATEGORY_GROUPS,
  groupOrder,
} from "@/data/categories";
import {
  ceremonyByOrdinal,
  ceremonySubtitle,
  ordinalSuffix,
} from "@/data/ceremonies";
import type {
  CeremonyCategory,
  CeremonyDetail,
  Entry,
  GridEntry,
  HeadlineWinner,
} from "@/lib/types";
import type { NominationRecord } from "./load-historical";

const CATEGORY_BY_ID = new Map(CATEGORIES.map((category) => [category.id, category]));

/** Hover rotation order from spec.md 6.1. Supporting roles are not included. */
export const HEADLINE_CATEGORY_IDS = [
  "best-picture",
  "best-director",
  "best-actor",
  "best-actress",
] as const;

/** Warn below this count of winner-less categories; fail at or above it. */
export const DEFAULT_MISSING_WINNER_THRESHOLD = 5;

export type BuildDetailsOptions = {
  missingWinnerThreshold?: number;
  /** Ordinals allowed to ship without a Best Picture winner, each with a written reason. */
  bestPictureExceptions?: readonly number[];
};

function toEntry(record: NominationRecord): Entry {
  return { names: record.names, movies: record.movies };
}

function winnerLabel(entry: Entry): string | undefined {
  return entry.names[0] ?? entry.movies[0]?.title;
}

/**
 * Group canonical nomination rows into per-ceremony details.
 * Empty category groups are omitted. Missing Best Picture fails unless excepted.
 */
export function buildCeremonyDetails(
  records: NominationRecord[],
  options: BuildDetailsOptions = {},
): CeremonyDetail[] {
  const threshold =
    options.missingWinnerThreshold ?? DEFAULT_MISSING_WINNER_THRESHOLD;
  const pictureExceptions = new Set(options.bestPictureExceptions ?? []);

  const byOrdinal = new Map<number, NominationRecord[]>();
  for (const record of records) {
    const existing = byOrdinal.get(record.ordinal);
    if (existing) existing.push(record);
    else byOrdinal.set(record.ordinal, [record]);
  }

  const missingWinners: string[] = [];
  const details: CeremonyDetail[] = [];

  for (const ordinal of [...byOrdinal.keys()].sort((a, b) => a - b)) {
    const ceremony = ceremonyByOrdinal(ordinal);
    if (!ceremony) {
      throw new Error(`No ceremony for ordinal ${ordinal}`);
    }

    type Bucket = {
      id: string;
      group: (typeof CATEGORIES)[number]["group"];
      order: number;
      label: string;
      winners: Entry[];
      nominees: Entry[];
    };
    const buckets = new Map<string, Bucket>();

    for (const record of byOrdinal.get(ordinal) ?? []) {
      const definition = CATEGORY_BY_ID.get(record.categoryId);
      if (!definition) {
        throw new Error(`Unknown canonical category id: ${record.categoryId}`);
      }
      const bucket = buckets.get(record.categoryId) ?? {
        id: definition.id,
        group: definition.group,
        order: definition.order,
        label: record.categoryLabel,
        winners: [],
        nominees: [],
      };
      const entry = toEntry(record);
      if (record.won) bucket.winners.push(entry);
      else bucket.nominees.push(entry);
      buckets.set(record.categoryId, bucket);
    }

    for (const [id, bucket] of [...buckets.entries()]) {
      if (bucket.winners.length === 0) {
        missingWinners.push(
          `${id} in the ${ordinalSuffix(ordinal)} ceremony (${ceremony.ceremonyYear})`,
        );
        buckets.delete(id);
      }
    }

    const grouped = new Map<Bucket["group"], CeremonyCategory[]>();
    const sorted = [...buckets.values()].sort((a, b) => {
      const groupDiff = groupOrder(a.group) - groupOrder(b.group);
      return groupDiff !== 0 ? groupDiff : a.order - b.order;
    });
    for (const bucket of sorted) {
      const list = grouped.get(bucket.group) ?? [];
      list.push({
        id: bucket.id,
        label: bucket.label,
        winners: bucket.winners,
        nominees: bucket.nominees,
      });
      grouped.set(bucket.group, list);
    }

    const groups = CATEGORY_GROUPS.flatMap((group) => {
      const categories = grouped.get(group.id);
      if (!categories || categories.length === 0) return [];
      return [{ id: group.id, label: group.label, categories }];
    });

    if (groups.length === 0) {
      throw new Error(
        `Ceremony ${ordinal} (${ceremony.slug}) has no categories; the year join likely broke`,
      );
    }

    const hasPictureWinner = groups
      .flatMap((group) => group.categories)
      .some((category) => category.id === "best-picture" && category.winners.length > 0);
    if (!hasPictureWinner && !pictureExceptions.has(ordinal)) {
      throw new Error(
        `Ceremony ${ordinal} (${ceremony.slug}) has no Best Picture winner`,
      );
    }

    details.push({ ceremony, groups });
  }

  if (missingWinners.length > threshold) {
    throw new Error(
      `Too many categories without a winner (${missingWinners.length} > ${threshold}): ${missingWinners.join("; ")}`,
    );
  }
  for (const warning of missingWinners) {
    console.warn(`Category has no winner: ${warning}`);
  }

  return details;
}

function headlineWinners(detail: CeremonyDetail): HeadlineWinner[] {
  const byId = new Map<string, CeremonyCategory>();
  for (const group of detail.groups) {
    for (const category of group.categories) {
      byId.set(category.id, category);
    }
  }

  const headline: HeadlineWinner[] = [];
  for (const id of HEADLINE_CATEGORY_IDS) {
    const category = byId.get(id);
    const winner = category?.winners[0];
    if (!category || !winner) continue;
    const name = winnerLabel(winner);
    if (!name) continue;
    const movie = winner.movies[0]?.title;
    headline.push(movie ? { category: category.label, winner: name, movie } : { category: category.label, winner: name });
  }
  return headline;
}

export function buildGridEntries(details: CeremonyDetail[]): GridEntry[] {
  return [...details]
    .sort((a, b) => b.ceremony.ordinal - a.ceremony.ordinal)
    .map((detail) => ({
      slug: detail.ceremony.slug,
      label: String(detail.ceremony.ceremonyYear),
      subtitle: ceremonySubtitle(detail.ceremony),
      decade: detail.ceremony.decade,
      ordinal: detail.ceremony.ordinal,
      headline: headlineWinners(detail),
      ...(bestPictureMoviePoster(detail)
        ? { posterPath: bestPictureMoviePoster(detail) }
        : {}),
    }));
}

function bestPictureMoviePoster(detail: CeremonyDetail): string | undefined {
  for (const group of detail.groups) {
    for (const category of group.categories) {
      if (category.id === "best-picture") {
        return category.winners[0]?.movies[0]?.posterPath;
      }
    }
  }
  return undefined;

}
