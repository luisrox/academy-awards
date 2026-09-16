import { describe, expect, it } from "vitest";
import {
  adjacentCeremonies,
  CEREMONIES,
  ceremonyByFilmYear,
  ceremonyByOrdinal,
  ceremonyBySlug,
  ceremonyDateLabel,
  ceremonySubtitle,
  decadeBuckets,
  ordinalSuffix,
} from "./ceremonies";

describe("ordinalSuffix", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [98, "98th"],
    [101, "101st"],
    [111, "111th"],
  ] as const)("%s becomes %s", (n, expected) => {
    expect(ordinalSuffix(n)).toBe(expected);
  });
});

describe("ceremony table invariants", () => {
  it("D1: contains exactly 98 editions", () => {
    expect(CEREMONIES).toHaveLength(98);
  });

  it("D2: slugs are unique and ordinals are 1..98 with no gaps", () => {
    const slugs = CEREMONIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(98);

    const ordinals = CEREMONIES.map((c) => c.ordinal).sort((a, b) => a - b);
    expect(ordinals).toEqual(Array.from({ length: 98 }, (_, i) => i + 1));
  });

  it("D3: ceremony dates are strictly increasing", () => {
    for (let i = 1; i < CEREMONIES.length; i++) {
      expect(CEREMONIES[i].ceremonyDate > CEREMONIES[i - 1].ceremonyDate).toBe(
        true,
      );
    }
  });

  it("D4: 1930 has two editions with distinct slugs, and neither is '1930'", () => {
    const editions1930 = CEREMONIES.filter((c) => c.ceremonyYear === 1930);
    expect(editions1930).toHaveLength(2);
    expect(editions1930.map((c) => c.slug).sort()).toEqual([
      "1930-2nd",
      "1930-3rd",
    ]);
    expect(editions1930.some((c) => c.slug === "1930")).toBe(false);
    expect(ceremonyBySlug("1930")).toBeUndefined();
  });

  it("D5: no ceremony was held in 1933", () => {
    expect(CEREMONIES.some((c) => c.ceremonyYear === 1933)).toBe(false);
  });

  it("D6: filmYearLabel values are unique and the first six use a slash", () => {
    const labels = CEREMONIES.map((c) => c.filmYearLabel);
    expect(new Set(labels).size).toBe(98);

    const firstSix = CEREMONIES.filter((c) => c.ordinal <= 6);
    expect(firstSix).toHaveLength(6);
    for (const ceremony of firstSix) {
      expect(ceremony.filmYearLabel).toMatch(/^\d{4}\/\d{2}$/);
    }
  });
});

describe("ceremony lookups", () => {
  it("ceremonyBySlug finds a known edition and misses an unknown one", () => {
    expect(ceremonyBySlug("2026")?.ordinal).toBe(98);
    expect(ceremonyBySlug("1930-2nd")?.ordinal).toBe(2);
    expect(ceremonyBySlug("not-a-year")).toBeUndefined();
  });

  it("ceremonyByOrdinal finds 1..98 and misses anything outside", () => {
    expect(ceremonyByOrdinal(1)?.slug).toBe("1929");
    expect(ceremonyByOrdinal(98)?.slug).toBe("2026");
    expect(ceremonyByOrdinal(0)).toBeUndefined();
    expect(ceremonyByOrdinal(99)).toBeUndefined();
  });

  it("ceremonyByFilmYear joins a straddled year and a modern year", () => {
    expect(ceremonyByFilmYear("1927/28")?.ordinal).toBe(1);
    expect(ceremonyByFilmYear(" 1927/28 ")?.ordinal).toBe(1);
    expect(ceremonyByFilmYear("2025")?.ordinal).toBe(98);
    expect(ceremonyByFilmYear("1933")).toBeUndefined();
    expect(ceremonyByFilmYear("nope")).toBeUndefined();
  });

  it("adjacentCeremonies walks chronological neighbors and stops at the ends", () => {
    expect(adjacentCeremonies("1929").previous).toBeUndefined();
    expect(adjacentCeremonies("1929").next?.slug).toBe("1930-2nd");
    expect(adjacentCeremonies("1930-2nd").previous?.slug).toBe("1929");
    expect(adjacentCeremonies("1930-2nd").next?.slug).toBe("1930-3rd");
    expect(adjacentCeremonies("2026").next).toBeUndefined();
    expect(adjacentCeremonies("2026").previous?.slug).toBe("2025");
    expect(adjacentCeremonies("missing").previous).toBeUndefined();
    expect(adjacentCeremonies("missing").next).toBeUndefined();
  });
});

describe("ceremony labels", () => {
  const ninetyEighth = ceremonyByOrdinal(98)!;

  it("ceremonySubtitle for the 98th edition", () => {
    expect(ceremonySubtitle(ninetyEighth)).toBe(
      "98th Ceremony \u2014 Films of 2025",
    );
  });

  it("ceremonyDateLabel for the 98th edition is March 15, 2026", () => {
    expect(ceremonyDateLabel(ninetyEighth)).toBe("March 15, 2026");
  });

  it("ceremonyDateLabel does not shift with the process timezone", () => {
    const isoDate = ninetyEighth.ceremonyDate;
    expect(isoDate).toBe("2026-03-15");

    const format = (iso: string, timeZone: string) =>
      new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone,
      });

    // A UTC-midnight parse of a date-only string is the classic trap:
    // western zones see the previous calendar day, eastern zones do not.
    const midnightUtc = `${isoDate}T00:00:00Z`;
    expect(format(midnightUtc, "America/Los_Angeles")).toBe("March 14, 2026");
    expect(format(midnightUtc, "Pacific/Auckland")).toBe("March 15, 2026");

    const label = ceremonyDateLabel(ninetyEighth);
    expect(label).toBe("March 15, 2026");
    expect(label).not.toBe(format(midnightUtc, "America/Los_Angeles"));

    // Formatting noon UTC in UTC is stable; that is the calendar date
    // the label must always report, regardless of host TZ.
    expect(format(`${isoDate}T12:00:00Z`, "UTC")).toBe(label);
  });
});

describe("decadeBuckets", () => {
  const buckets = decadeBuckets();

  it("returns decades in descending order", () => {
    const decades = buckets.map((b) => b.decade);
    expect(decades).toEqual([...decades].sort((a, b) => b.localeCompare(a)));
    expect(decades[0]).toBe("2020s");
    expect(decades.at(-1)).toBe("1920s");
  });

  it("puts the single 1920s edition in its own bucket (accepted, not a bug)", () => {
    const twenties = buckets.find((b) => b.decade === "1920s");
    expect(twenties?.ceremonies).toHaveLength(1);
    expect(twenties?.ceremonies[0].ordinal).toBe(1);
  });
});
