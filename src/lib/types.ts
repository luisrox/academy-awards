/** Canonical grouping used to order categories inside the ceremony detail view. */
export type CategoryGroup =
  | "headline"
  | "acting"
  | "writing"
  | "feature"
  | "craft"
  | "music"
  | "shorts"
  | "retired"
  | "special";

export type Ceremony = {
  /** 1-98, the edition number. */
  ordinal: number;
  /** Year the ceremony was held. Not unique: 1930 hosted both the 2nd and the 3rd. */
  ceremonyYear: number;
  /** ISO date the ceremony was held. */
  ceremonyDate: string;
  /** Award year as the Academy labels it: "2025", or "1927/28" for the straddled editions. */
  filmYearLabel: string;
  /** Route segment. Equals the ceremony year except for the two 1930 editions. */
  slug: string;
  /** Decade bucket of the ceremony year, e.g. "2020s". */
  decade: string;
};

/** A single nomination: who/what was up for the award, and for which film(s). */
export type Entry = {
  names: string[];
  movies: Movie[];
};

export type Movie = {
  title: string;
  tmdbId?: number;
  imdbId?: string;
};

export type CeremonyCategory = {
  /** Stable canonical id, e.g. "best-picture". */
  id: string;
  /** Category name as the Academy used it that year, e.g. "ACTOR" in 1929. */
  label: string;
  /** Usually one, but ties produced multiple winners. */
  winners: Entry[];
  /** Nominees that did not win. */
  nominees: Entry[];
};

export type CeremonyCategoryGroup = {
  id: CategoryGroup;
  label: string;
  categories: CeremonyCategory[];
};

export type CeremonyDetail = {
  ceremony: Ceremony;
  groups: CeremonyCategoryGroup[];
};

/** The four winners rotated in the card hover animation. */
export type HeadlineWinner = {
  category: string;
  winner: string;
  movie?: string;
};

/** Lightweight per-edition record powering the grid. Kept small on purpose. */
export type GridEntry = {
  slug: string;
  /** The big number on the card, e.g. "2026". */
  label: string;
  /** e.g. "98th Ceremony - Films of 2025". */
  subtitle: string;
  decade: string;
  ordinal: number;
  headline: HeadlineWinner[];
  posterPath?: string;
};

export type SearchDoc = {
  slug: string;
  label: string;
  /** "year" | "film" | "person" */
  kind: "year" | "film" | "person";
  title: string;
  /** Short context line, e.g. "Best Picture winner - 2026". */
  detail: string;
  won: boolean;
};
