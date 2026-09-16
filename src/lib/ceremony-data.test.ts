import { describe, expect, it } from "vitest";
import { CEREMONIES } from "@/data/ceremonies";
import { ceremonyDetailSchema, gridEntrySchema } from "@/lib/schemas";
import {
  getAllSlugs,
  getCeremonyDetail,
  getGridEntries,
} from "./ceremony-data";

describe("ceremony-data", () => {
  it("getAllSlugs returns the 98 ceremony table slugs", () => {
    const slugs = getAllSlugs();
    expect(slugs).toHaveLength(98);
    expect(new Set(slugs)).toEqual(
      new Set(CEREMONIES.map((ceremony) => ceremony.slug)),
    );
  });

  it("getCeremonyDetail returns a Zod-valid detail for a known slug", () => {
    const detail = getCeremonyDetail("2024");
    expect(ceremonyDetailSchema.safeParse(detail).success).toBe(true);
    expect(detail?.ceremony.ordinal).toBe(96);
  });

  it("getCeremonyDetail returns null for an unknown slug instead of throwing", () => {
    expect(getCeremonyDetail("not-a-ceremony")).toBeNull();
    expect(getCeremonyDetail("../etc/passwd")).toBeNull();
  });

  it("getGridEntries matches the committed index", () => {
    const entries = getGridEntries();
    expect(entries).toHaveLength(98);
    expect(gridEntrySchema.safeParse(entries[0]).success).toBe(true);
  });
});
