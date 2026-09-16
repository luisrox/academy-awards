import type { Ceremony } from "@/lib/types";

/**
 * Dates the Academy Awards were actually handed out, indexed by edition.
 * Source: the official Academy Awards Database (awardsdatabase.oscars.org).
 *
 * Two quirks drive the rest of the data model:
 *  - 1930 hosted two ceremonies (2nd in April, 3rd in November), so the
 *    ceremony year alone cannot identify an edition.
 *  - No ceremony was held in 1933; the 6th jumped to March 1934.
 *
 * Public URL contract (spec.md 12): `/{slug}` is a published identifier.
 * Once a ceremony is live, its slug must not change. Ambiguous years never
 * occupy the bare /YYYY path; they use /YYYY-{ordinal} (e.g. /1930-2nd).
 */
const CEREMONY_DATES: string[] = [
  "1929-05-16", // 1st
  "1930-04-03", // 2nd
  "1930-11-05", // 3rd
  "1931-11-10", // 4th
  "1932-11-18", // 5th
  "1934-03-16", // 6th
  "1935-02-27", // 7th
  "1936-03-05", // 8th
  "1937-03-04", // 9th
  "1938-03-10", // 10th
  "1939-02-23", // 11th
  "1940-02-29", // 12th
  "1941-02-27", // 13th
  "1942-02-26", // 14th
  "1943-03-04", // 15th
  "1944-03-02", // 16th
  "1945-03-15", // 17th
  "1946-03-07", // 18th
  "1947-03-13", // 19th
  "1948-03-20", // 20th
  "1949-03-24", // 21st
  "1950-03-23", // 22nd
  "1951-03-29", // 23rd
  "1952-03-20", // 24th
  "1953-03-19", // 25th
  "1954-03-25", // 26th
  "1955-03-30", // 27th
  "1956-03-21", // 28th
  "1957-03-27", // 29th
  "1958-03-26", // 30th
  "1959-04-06", // 31st
  "1960-04-04", // 32nd
  "1961-04-17", // 33rd
  "1962-04-09", // 34th
  "1963-04-08", // 35th
  "1964-04-13", // 36th
  "1965-04-05", // 37th
  "1966-04-18", // 38th
  "1967-04-10", // 39th
  "1968-04-10", // 40th
  "1969-04-14", // 41st
  "1970-04-07", // 42nd
  "1971-04-15", // 43rd
  "1972-04-10", // 44th
  "1973-03-27", // 45th
  "1974-04-02", // 46th
  "1975-04-08", // 47th
  "1976-03-29", // 48th
  "1977-03-28", // 49th
  "1978-04-03", // 50th
  "1979-04-09", // 51st
  "1980-04-14", // 52nd
  "1981-03-31", // 53rd
  "1982-03-29", // 54th
  "1983-04-11", // 55th
  "1984-04-09", // 56th
  "1985-03-25", // 57th
  "1986-03-24", // 58th
  "1987-03-30", // 59th
  "1988-04-11", // 60th
  "1989-03-29", // 61st
  "1990-03-26", // 62nd
  "1991-03-25", // 63rd
  "1992-03-30", // 64th
  "1993-03-29", // 65th
  "1994-03-21", // 66th
  "1995-03-27", // 67th
  "1996-03-25", // 68th
  "1997-03-24", // 69th
  "1998-03-23", // 70th
  "1999-03-21", // 71st
  "2000-03-26", // 72nd
  "2001-03-25", // 73rd
  "2002-03-24", // 74th
  "2003-03-23", // 75th
  "2004-02-29", // 76th
  "2005-02-27", // 77th
  "2006-03-05", // 78th
  "2007-02-25", // 79th
  "2008-02-24", // 80th
  "2009-02-22", // 81st
  "2010-03-07", // 82nd
  "2011-02-27", // 83rd
  "2012-02-26", // 84th
  "2013-02-24", // 85th
  "2014-03-02", // 86th
  "2015-02-22", // 87th
  "2016-02-28", // 88th
  "2017-02-26", // 89th
  "2018-03-04", // 90th
  "2019-02-24", // 91st
  "2020-02-09", // 92nd
  "2021-04-25", // 93rd
  "2022-03-27", // 94th
  "2023-03-12", // 95th
  "2024-03-10", // 96th
  "2025-03-02", // 97th
  "2026-03-15", // 98th
];

/**
 * The first six editions honoured films spanning two calendar years, and the
 * Academy still labels them with a slash. Everything from the 7th on is simply
 * the calendar year before the ceremony.
 */
const STRADDLED_FILM_YEARS: Record<number, string> = {
  1: "1927/28",
  2: "1928/29",
  3: "1929/30",
  4: "1930/31",
  5: "1931/32",
  6: "1932/33",
};

export function ordinalSuffix(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function decadeOf(year: number): string {
  return `${Math.floor(year / 10) * 10}s`;
}

function buildCeremonies(): Ceremony[] {
  const yearCounts = new Map<number, number>();
  for (const date of CEREMONY_DATES) {
    const year = Number(date.slice(0, 4));
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }

  return CEREMONY_DATES.map((ceremonyDate, index) => {
    const ordinal = index + 1;
    const ceremonyYear = Number(ceremonyDate.slice(0, 4));
    const isAmbiguousYear = (yearCounts.get(ceremonyYear) ?? 0) > 1;

    return {
      ordinal,
      ceremonyYear,
      ceremonyDate,
      filmYearLabel: STRADDLED_FILM_YEARS[ordinal] ?? String(ceremonyYear - 1),
      // Public contract: this slug is the permanent URL. Do not rename a
      // published edition; ambiguous years are always suffixed so neither
      // silently claims the bare /YYYY route.
      slug: isAmbiguousYear
        ? `${ceremonyYear}-${ordinalSuffix(ordinal)}`
        : String(ceremonyYear),
      decade: decadeOf(ceremonyYear),
    };
  });
}

export const CEREMONIES: Ceremony[] = buildCeremonies();

/** Most recent edition first, which is the order the grid renders. */
export const CEREMONIES_DESC: Ceremony[] = [...CEREMONIES].reverse();

export const LATEST_CEREMONY: Ceremony = CEREMONIES[CEREMONIES.length - 1];

const BY_SLUG = new Map(CEREMONIES.map((c) => [c.slug, c]));
const BY_ORDINAL = new Map(CEREMONIES.map((c) => [c.ordinal, c]));
/** Film year label -> ceremony, used to join the historical nominations data. */
const BY_FILM_YEAR = new Map(CEREMONIES.map((c) => [c.filmYearLabel, c]));

export function ceremonyBySlug(slug: string): Ceremony | undefined {
  return BY_SLUG.get(slug);
}

export function ceremonyByOrdinal(ordinal: number): Ceremony | undefined {
  return BY_ORDINAL.get(ordinal);
}

export function ceremonyByFilmYear(filmYear: string): Ceremony | undefined {
  return BY_FILM_YEAR.get(filmYear.trim());
}

/** Chronological neighbors. The 1st has no previous; the 98th has no next. */
export function adjacentCeremonies(slug: string): {
  previous: Ceremony | undefined;
  next: Ceremony | undefined;
} {
  const current = ceremonyBySlug(slug);
  if (!current) return { previous: undefined, next: undefined };
  return {
    previous: ceremonyByOrdinal(current.ordinal - 1),
    next: ceremonyByOrdinal(current.ordinal + 1),
  };
}

function groupByYear(ceremonies: Ceremony[]): Map<number, Ceremony[]> {
  const groups = new Map<number, Ceremony[]>();
  for (const ceremony of ceremonies) {
    const list = groups.get(ceremony.ceremonyYear) ?? [];
    list.push(ceremony);
    groups.set(ceremony.ceremonyYear, list);
  }
  return groups;
}

function editionsInYear(year: number, ceremonies: Ceremony[]): Ceremony[] {
  return [...(groupByYear(ceremonies).get(year) ?? [])].sort(
    (a, b) => a.ordinal - b.ordinal,
  );
}

/**
 * Bare years that hosted more than one ceremony and therefore must not
 * occupy /YYYY. Derived from the table, not from a 1930 special case.
 */
export function ambiguousBareYearSlugs(
  ceremonies: Ceremony[] = CEREMONIES,
): string[] {
  const slugs: string[] = [];
  for (const [year, editions] of groupByYear(ceremonies)) {
    if (editions.length < 2) continue;
    const bare = String(year);
    if (editions.some((ceremony) => ceremony.slug === bare)) continue;
    slugs.push(bare);
  }
  return slugs;
}

/**
 * If `slug` is a bare year with two or more editions, the canonical slug
 * of the earliest (lowest ordinal). Otherwise undefined.
 */
export function ambiguousYearRedirect(
  slug: string,
  ceremonies: Ceremony[] = CEREMONIES,
): string | undefined {
  if (!/^\d{4}$/.test(slug)) return undefined;
  const editions = editionsInYear(Number(slug), ceremonies);
  if (editions.length < 2) return undefined;
  if (editions.some((ceremony) => ceremony.slug === slug)) return undefined;
  return editions[0].slug;
}

/** Other editions held in the same calendar year, if any. */
export function siblingCeremonies(
  slug: string,
  ceremonies: Ceremony[] = CEREMONIES,
): Ceremony[] {
  const current = ceremonies.find((ceremony) => ceremony.slug === slug);
  if (!current) return [];
  return editionsInYear(current.ceremonyYear, ceremonies).filter(
    (ceremony) => ceremony.slug !== slug,
  );
}

export function ceremonySubtitle(ceremony: Ceremony): string {
  return `${ordinalSuffix(ceremony.ordinal)} Ceremony \u2014 Films of ${ceremony.filmYearLabel}`;
}

export function ceremonyDateLabel(ceremony: Ceremony): string {
  // Fixed UTC formatting so the label never shifts with the viewer's timezone.
  return new Date(`${ceremony.ceremonyDate}T12:00:00Z`).toLocaleDateString(
    "en-US",
    { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" },
  );
}

/** Ordered decade buckets for the jump navigation, newest first. */
export function decadeBuckets(): { decade: string; ceremonies: Ceremony[] }[] {
  const buckets = new Map<string, Ceremony[]>();
  for (const ceremony of CEREMONIES_DESC) {
    const existing = buckets.get(ceremony.decade);
    if (existing) existing.push(ceremony);
    else buckets.set(ceremony.decade, [ceremony]);
  }
  return [...buckets.entries()].map(([decade, ceremonies]) => ({
    decade,
    ceremonies,
  }));
}
