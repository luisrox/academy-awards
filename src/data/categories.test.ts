import { describe, expect, it } from "vitest";
import type { CategoryGroup } from "@/lib/types";
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  groupOrder,
  normalizeCategoryName,
  parseFilmYear,
  resolveCategoryId,
  resolveCategoryLabel,
} from "./categories";

const SPEC_ORDER: { id: CategoryGroup; label: string }[] = [
  { id: "headline", label: "The Big Two" },
  { id: "acting", label: "Acting" },
  { id: "writing", label: "Writing" },
  { id: "feature", label: "Features" },
  { id: "craft", label: "Crafts" },
  { id: "music", label: "Music" },
  { id: "shorts", label: "Short Films" },
  { id: "retired", label: "Retired Categories" },
  { id: "special", label: "Special Awards" },
];

describe("CATEGORY_GROUPS", () => {
  it("declares all 9 groups", () => {
    expect(CATEGORY_GROUPS).toHaveLength(9);
  });

  it("has unique ids", () => {
    const ids = CATEGORY_GROUPS.map((group) => group.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("matches the spec.md 5.4 order and labels", () => {
    expect(CATEGORY_GROUPS.map((group) => group.id)).toEqual(
      SPEC_ORDER.map((group) => group.id),
    );
    expect(CATEGORY_GROUPS.map((group) => group.label)).toEqual(
      SPEC_ORDER.map((group) => group.label),
    );
  });

  it("has an entry for every CategoryGroup value", () => {
    // Record<CategoryGroup, true> fails to compile if the union grows
    // and this object is not updated — then the loop fails until
    // CATEGORY_GROUPS also gains the new id.
    const required: Record<CategoryGroup, true> = {
      headline: true,
      acting: true,
      writing: true,
      feature: true,
      craft: true,
      music: true,
      shorts: true,
      retired: true,
      special: true,
    };

    const declared = new Set(CATEGORY_GROUPS.map((group) => group.id));
    for (const id of Object.keys(required) as CategoryGroup[]) {
      expect(declared.has(id)).toBe(true);
    }
    expect(declared.size).toBe(Object.keys(required).length);
  });
});

describe("groupOrder", () => {
  it("returns the group's index in CATEGORY_GROUPS", () => {
    expect(groupOrder("headline")).toBe(0);
    expect(groupOrder("special")).toBe(8);
    for (const [index, group] of CATEGORY_GROUPS.entries()) {
      expect(groupOrder(group.id)).toBe(index);
    }
  });
});

/** Exact category strings from delventhalz/json-nominations (34 names). */
const HISTORICAL_CATEGORY_NAMES = [
  "Best Actor",
  "Best Actress",
  "Best Adapted Screenplay",
  "Best Animated Feature",
  "Best Animated Short",
  "Best Assistant Director",
  "Best Cinematography (Black and White)",
  "Best Cinematography (Color)",
  "Best Costume Design (Black and White)",
  "Best Costume Design (Color)",
  "Best Dance Direction",
  "Best Director",
  "Best Documentary Feature",
  "Best Documentary Short",
  "Best Film Editing",
  "Best International Feature Film",
  "Best Live Action Short (Color)",
  "Best Live Action Short (Comedy or One Reel or Regular)",
  "Best Live Action Short (Two-Reel or Novelty)",
  "Best Makeup and Hairstyling",
  "Best Original Musical/Secondary Score Category",
  "Best Original Screenplay",
  "Best Original Song",
  "Best Original Story",
  "Best Picture",
  "Best Production Design (Black and White)",
  "Best Production Design (Color)",
  "Best Score",
  "Best Sound Editing",
  "Best Sound Mixing",
  "Best Supporting Actor",
  "Best Supporting Actress",
  "Best Visual/Special Effects",
  "Unique and Artistic Production",
] as const;

describe("CATEGORIES", () => {
  it("has unique canonical ids", () => {
    const ids = CATEGORIES.map((category) => category.id);
    expect(ids).toHaveLength(35);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("never maps the same normalized alias to two definitions", () => {
    const seen = new Map<string, string>();
    const duplicates: string[] = [];

    for (const category of CATEGORIES) {
      for (const alias of category.aliases) {
        const key = normalizeCategoryName(alias);
        const owner = seen.get(key);
        if (owner && owner !== category.id) {
          duplicates.push(`${key} (${owner} vs ${category.id})`);
        } else {
          seen.set(key, category.id);
        }
      }
    }

    expect(duplicates).toEqual([]);
  });

  it("only uses groups declared in CATEGORY_GROUPS", () => {
    const known = new Set(CATEGORY_GROUPS.map((group) => group.id));
    for (const category of CATEGORIES) {
      expect(known.has(category.group)).toBe(true);
    }
  });

  it("has a unique (group, order) pair per category", () => {
    const pairs = CATEGORIES.map(
      (category) => `${category.group}:${category.order}`,
    );
    expect(new Set(pairs).size).toBe(pairs.length);
  });

  it("can resolve a label for every canonical id", () => {
    for (const category of CATEGORIES) {
      expect(resolveCategoryLabel(category.id, 2025)).toBeTruthy();
    }
  });
});

describe("resolveCategoryId", () => {
  it("resolves all 34 historical dataset names", () => {
    expect(HISTORICAL_CATEGORY_NAMES).toHaveLength(34);
    for (const name of HISTORICAL_CATEGORY_NAMES) {
      expect(resolveCategoryId(name), name).toBeDefined();
    }
  });

  it("treats case, spacing, and punctuation as the same key", () => {
    expect(normalizeCategoryName("MUSIC (ORIGINAL SCORE)")).toBe(
      normalizeCategoryName("Music - Original Score"),
    );
    expect(resolveCategoryId("MUSIC (ORIGINAL SCORE)")?.id).toBe(
      "best-original-score",
    );
    expect(resolveCategoryId("Music - Original Score")?.id).toBe(
      "best-original-score",
    );
    expect(resolveCategoryId("  best   actor  ")?.id).toBe("best-actor");
    expect(resolveCategoryId("ACTOR IN A LEADING ROLE")?.id).toBe("best-actor");
    expect(resolveCategoryId("WRITING (ADAPTED SCREENPLAY)")?.id).toBe(
      "best-adapted-screenplay",
    );
  });

  it("returns undefined for an unknown name", () => {
    expect(resolveCategoryId("Best Invented Category")).toBeUndefined();
  });
});

describe("parseFilmYear", () => {
  it("returns the closing year of a straddled label", () => {
    expect(parseFilmYear("1927/28")).toBe(1928);
    expect(parseFilmYear("1932/33")).toBe(1933);
  });

  it("returns a modern four-digit year unchanged", () => {
    expect(parseFilmYear("2025")).toBe(2025);
  });
});

describe("resolveCategoryLabel", () => {
  it.each([
    // cinematography: 1957 unified blip, then Color until 1966
    ["best-cinematography", 1956, "Best Cinematography (Color)"],
    ["best-cinematography", 1957, "Best Cinematography"],
    ["best-cinematography", 1958, "Best Cinematography (Color)"],
    ["best-cinematography", 1966, "Best Cinematography (Color)"],
    ["best-cinematography", 1967, "Best Cinematography"],
    ["best-cinematography", 1968, "Best Cinematography"],
    ["best-cinematography-bw", 1955, "Best Cinematography (Black and White)"],
    ["best-cinematography-bw", 1966, "Best Cinematography (Black and White)"],
    // production design / art direction
    ["best-production-design", 1956, "Best Art Direction (Color)"],
    ["best-production-design", 1957, "Best Art Direction"],
    ["best-production-design", 1958, "Best Art Direction"],
    ["best-production-design", 1959, "Best Art Direction (Color)"],
    ["best-production-design", 1966, "Best Art Direction (Color)"],
    ["best-production-design", 1967, "Best Art Direction"],
    ["best-production-design", 2011, "Best Art Direction"],
    ["best-production-design", 2012, "Best Production Design"],
    ["best-production-design", 2013, "Best Production Design"],
    ["best-production-design-bw", 1960, "Best Art Direction (Black and White)"],
    // costume
    ["best-costume-design", 1956, "Best Costume Design (Color)"],
    ["best-costume-design", 1958, "Best Costume Design"],
    ["best-costume-design", 1959, "Best Costume Design (Color)"],
    ["best-costume-design", 1966, "Best Costume Design (Color)"],
    ["best-costume-design", 1967, "Best Costume Design"],
    ["best-costume-design", 1968, "Best Costume Design"],
    ["best-costume-design-bw", 1955, "Best Costume Design (Black and White)"],
    // international
    ["best-international-feature", 2017, "Best Foreign Language Film"],
    ["best-international-feature", 2018, "Best Foreign Language Film"],
    ["best-international-feature", 2019, "Best International Feature Film"],
    // makeup
    ["best-makeup-hairstyling", 2010, "Best Makeup"],
    ["best-makeup-hairstyling", 2011, "Best Makeup"],
    ["best-makeup-hairstyling", 2012, "Best Makeup and Hairstyling"],
    // visual effects (corrected vs spec 5.3)
    ["best-visual-effects", 1962, "Best Special Effects"],
    ["best-visual-effects", 1963, "Best Special Effects"],
    ["best-visual-effects", 1964, "Best Special Visual Effects"],
    ["best-visual-effects", 1971, "Best Special Visual Effects"],
    ["best-visual-effects", 1972, "Best Visual Effects"],
    // sound
    ["best-sound", 1956, "Best Sound Recording"],
    ["best-sound", 1957, "Best Sound Recording"],
    ["best-sound", 1958, "Best Sound"],
    ["best-sound", 2002, "Best Sound"],
    ["best-sound", 2003, "Best Sound Mixing"],
    ["best-sound", 2019, "Best Sound Mixing"],
    ["best-sound", 2020, "Best Sound"],
    // sound editing
    ["best-sound-editing", 1975, "Best Sound Effects"],
    ["best-sound-editing", 1976, "Best Sound Effects"],
    ["best-sound-editing", 1977, "Best Sound Effects Editing"],
    ["best-sound-editing", 1999, "Best Sound Effects Editing"],
    ["best-sound-editing", 2000, "Best Sound Editing"],
    // documentary
    ["best-documentary-feature", 2020, "Best Documentary Feature"],
    ["best-documentary-feature", 2021, "Best Documentary Feature"],
    ["best-documentary-feature", 2022, "Best Documentary Feature Film"],
    // live action short
    ["best-live-action-short", 1955, "Best Live Action Short Film (One Reel)"],
    ["best-live-action-short", 1956, "Best Live Action Short Film (One Reel)"],
    ["best-live-action-short", 1957, "Best Live Action Short Film"],
    ["best-live-action-short-two-reel", 1952, "Best Live Action Short Film (Two-Reel)"],
    ["best-score-musical-adaptation", 1965, "Best Score (Musical or Adaptation)"],
  ] as const)("%s in %s is %s", (id, year, label) => {
    expect(resolveCategoryLabel(id, year)).toBe(label);
  });

  it("returns the base label when a category has no era rule", () => {
    expect(resolveCategoryLabel("best-director", 1928)).toBe("Best Director");
    expect(resolveCategoryLabel("best-director", 2025)).toBe("Best Director");
    expect(resolveCategoryLabel("best-picture", 1928)).toBe("Best Picture");
    expect(resolveCategoryLabel("best-actor", 2025)).toBe("Best Actor");
  });

  it("keeps the Color suffix on 1955 costume and drops it by 2023", () => {
    expect(resolveCategoryLabel("best-costume-design", 1955)).toBe(
      "Best Costume Design (Color)",
    );
    expect(resolveCategoryLabel("best-costume-design", 2023)).toBe(
      "Best Costume Design",
    );
  });
});
