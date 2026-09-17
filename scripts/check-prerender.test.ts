import { describe, expect, it } from "vitest";
import {
  missingCeremonyPrerenders,
  clientChunksContainSearchIndex,
  type PrerenderManifest,
} from "./check-prerender";

const slugs = ["2024", "1930-2nd", "1929"];

describe("check-prerender", () => {
  it("reports no missing routes when every slug is prerendered", () => {
    const manifest: PrerenderManifest = {
      routes: {
        "/": {},
        "/2024": {},
        "/1930-2nd": {},
        "/1929": {},
      },
    };
    expect(missingCeremonyPrerenders(manifest, slugs)).toEqual([]);
  });

  it("names every ceremony route missing from the prerender manifest", () => {
    const manifest: PrerenderManifest = {
      routes: {
        "/": {},
        "/2024": {},
      },
    };
    expect(missingCeremonyPrerenders(manifest, slugs)).toEqual([
      "1930-2nd",
      "1929",
    ]);
  });
});

describe("clientChunksContainSearchIndex", () => {
  it("ignores source that only mentions film kind once", () => {
    expect(
      clientChunksContainSearchIndex(['kind:"film"', "SearchPalette"]),
    ).toBe(false);
  });

  it("flags a chunk that inlined many search documents", () => {
    const leaked = Array.from({ length: 24 }, () => '"kind":"film"').join(",");
    expect(clientChunksContainSearchIndex([leaked])).toBe(true);
  });
});
