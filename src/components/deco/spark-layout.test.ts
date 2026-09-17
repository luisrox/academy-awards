import { describe, expect, it } from "vitest";
import { SPARK_MAX, SPARK_MIN, sparkLayout } from "./spark-layout";

describe("sparkLayout", () => {
  it("is deterministic for the same slug and distinct across slugs", () => {
    expect(sparkLayout("2026")).toEqual(sparkLayout("2026"));
    expect(sparkLayout("2026")).not.toEqual(sparkLayout("2025"));
    expect(sparkLayout("1930-2nd")).not.toEqual(sparkLayout("1930"));
  });

  it("places between 5 and 7 sparks", () => {
    for (const slug of ["2026", "2025", "1929", "1930-2nd", "2002"]) {
      const count = sparkLayout(slug).length;
      expect(count).toBeGreaterThanOrEqual(SPARK_MIN);
      expect(count).toBeLessThanOrEqual(SPARK_MAX);
    }
  });
});
