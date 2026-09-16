import { describe, expect, it } from "vitest";
import { CEREMONIES } from "@/data/ceremonies";
import { getAllSlugs, getCeremonyDetail } from "@/lib/ceremony-data";
import {
  bestPictureWinnerName,
  canonicalSlug,
  ceremonyJsonLd,
  ceremonyMetadata,
  ceremonyPageDescription,
  ceremonyPageTitle,
  siteUrl,
  sitemapEntries,
} from "./seo";

describe("ceremony metadata", () => {
  it("generateMetadata of the 98th edition produces the expected title", () => {
    const detail = getCeremonyDetail("2026");
    if (!detail) throw new Error("missing 2026");
    expect(ceremonyPageTitle(detail)).toBe(
      "2026 Oscar Winners \u2014 98th Academy Awards",
    );
    expect(ceremonyMetadata(detail).title).toBe(
      "2026 Oscar Winners \u2014 98th Academy Awards",
    );
  });

  it("mentions the Best Picture winner in the description", () => {
    const detail = getCeremonyDetail("2026");
    if (!detail) throw new Error("missing 2026");
    expect(bestPictureWinnerName(detail)).toBe("One Battle after Another");
    expect(ceremonyPageDescription(detail)).toMatch(/One Battle after Another/);
  });

  it("produces coherent metadata for an ambiguous slug", () => {
    expect(canonicalSlug("1930")).toBe("1930-2nd");
    const detail = getCeremonyDetail("1930-2nd");
    if (!detail) throw new Error("missing 1930-2nd");
    const metadata = ceremonyMetadata(detail);
    expect(metadata.title).toBe("1930 Oscar Winners \u2014 2nd Academy Awards");
    expect(metadata.alternates?.canonical).toBe("/1930-2nd");
    expect(ceremonyPageDescription(detail)).toMatch(/The Broadway Melody/);
  });
});

describe("sitemap", () => {
  it("has 99 entries and every path exists", () => {
    const entries = sitemapEntries();
    expect(entries).toHaveLength(99);
    const paths = entries.map((entry) => new URL(entry.url).pathname);
    expect(paths).toContain("/");
    const slugs = paths.filter((path) => path !== "/").map((path) => path.slice(1));
    expect(slugs).toHaveLength(98);
    expect(new Set(slugs)).toEqual(new Set(getAllSlugs()));
    expect(new Set(slugs)).toEqual(
      new Set(CEREMONIES.map((ceremony) => ceremony.slug)),
    );
    for (const slug of slugs) {
      expect(getCeremonyDetail(slug), slug).not.toBeNull();
    }
  });
});

describe("JSON-LD", () => {
  it("is valid JSON and lists the awards for an edition", () => {
    const detail = getCeremonyDetail("2026");
    if (!detail) throw new Error("missing 2026");
    const data = ceremonyJsonLd(detail);
    expect(() => JSON.parse(JSON.stringify(data))).not.toThrow();
    expect(data["@type"]).toBe("Event");
    expect(data.name).toBe("98th Academy Awards");
    const serialized = JSON.stringify(data);
    expect(serialized).toMatch(/Best Picture/);
    expect(serialized).toMatch(/One Battle after Another/);
    expect(Array.isArray(data.award)).toBe(true);
    expect((data.award as unknown[]).length).toBeGreaterThan(0);
  });
});

describe("siteUrl", () => {
  it("has no trailing slash", () => {
    expect(siteUrl().endsWith("/")).toBe(false);
  });
});
