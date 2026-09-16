import { describe, expect, it } from "vitest";
import type { CategoryGroup } from "@/lib/types";
import {
  CATEGORIES,
  CATEGORY_GROUPS,
  groupOrder,
  normalizeCategoryName,
  resolveCategoryId,
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
