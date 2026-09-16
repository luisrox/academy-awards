import { describe, expect, it } from "vitest";
import type { CategoryGroup } from "@/lib/types";
import { CATEGORY_GROUPS, groupOrder } from "./categories";

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
