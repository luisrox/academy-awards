import { beforeEach, describe, expect, it, vi } from "vitest";
import { ambiguousBareYearSlugs, CEREMONIES } from "@/data/ceremonies";

const { mockNotFound, mockRedirect } = vi.hoisted(() => ({
  mockNotFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  mockRedirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
  useRouter: () => ({ push: vi.fn() }),
}));

import CeremonyPage, { generateStaticParams } from "./page";

beforeEach(() => {
  mockNotFound.mockClear();
  mockRedirect.mockClear();
});

describe("ceremony detail route", () => {
  it("generateStaticParams returns the 98 ceremony slugs plus ambiguous years", () => {
    const params = generateStaticParams();
    const slugs = params.map((entry) => entry.slug);
    expect(slugs).toEqual(
      expect.arrayContaining(CEREMONIES.map((ceremony) => ceremony.slug)),
    );
    expect(slugs).toEqual(expect.arrayContaining(ambiguousBareYearSlugs()));
    expect(slugs).toHaveLength(98 + ambiguousBareYearSlugs().length);
    expect(slugs).toContain("1930");
  });

  it("redirects /1930 to 1930-2nd", async () => {
    await expect(
      CeremonyPage({ params: Promise.resolve({ slug: "1930" }) }),
    ).rejects.toThrow("NEXT_REDIRECT:/1930-2nd");
    expect(mockRedirect).toHaveBeenCalledWith("/1930-2nd");
  });

  it("renders not-found for an invented slug", async () => {
    await expect(
      CeremonyPage({ params: Promise.resolve({ slug: "not-a-ceremony" }) }),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });
});
