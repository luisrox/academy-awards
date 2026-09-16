import { describe, expect, it, vi } from "vitest";
import { CEREMONIES } from "@/data/ceremonies";

vi.mock("next/navigation", () => ({
  notFound: vi.fn(),
  useRouter: () => ({ push: vi.fn() }),
}));

import { generateStaticParams } from "./page";

describe("ceremony detail route", () => {
  it("generateStaticParams returns the 98 ceremony slugs", () => {
    const params = generateStaticParams();
    expect(params).toHaveLength(98);
    expect(params.map((entry) => entry.slug).sort()).toEqual(
      CEREMONIES.map((ceremony) => ceremony.slug).sort(),
    );
  });
});
