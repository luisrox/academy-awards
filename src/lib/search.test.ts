import { describe, expect, it } from "vitest";
import type { SearchDoc } from "@/lib/types";
import {
  SEARCH_GROUP_LIMIT,
  filterSearchDocs,
  groupSearchDocs,
  normalizeSearchText,
} from "./search";

const docs: SearchDoc[] = [
  {
    slug: "2026",
    label: "2026",
    kind: "year",
    title: "2026",
    detail: "98th Ceremony — Films of 2025",
    won: false,
  },
  {
    slug: "2020",
    label: "Parasite",
    kind: "film",
    title: "Parasite",
    detail: "2020",
    won: true,
  },
  {
    slug: "2002",
    label: "Amélie",
    kind: "film",
    title: "Amélie",
    detail: "2002",
    won: false,
  },
  {
    slug: "2024",
    label: "Cillian Murphy",
    kind: "person",
    title: "Cillian Murphy",
    detail: "2024",
    won: true,
  },
  {
    slug: "2025",
    label: "Jane Smith",
    kind: "person",
    title: "Jane Smith",
    detail: "2025",
    won: false,
  },
];

describe("filterSearchDocs", () => {
  it("returns nothing for an empty query", () => {
    expect(filterSearchDocs(docs, "   ")).toEqual([]);
  });

  it("finds a year, a film, and a person", () => {
    expect(filterSearchDocs(docs, "2026").map((doc) => doc.kind)).toEqual(["year"]);
    expect(filterSearchDocs(docs, "Parasite")[0]).toMatchObject({
      kind: "film",
      slug: "2020",
      won: true,
    });
    expect(filterSearchDocs(docs, "cillian murphy")[0]).toMatchObject({
      kind: "person",
      title: "Cillian Murphy",
      won: true,
    });
  });

  it("matches Amélie when the query has no accent", () => {
    const [amelie] = filterSearchDocs(docs, "Amelie");
    expect(amelie?.title).toBe("Amélie");
    expect(amelie?.won).toBe(false);
    expect(normalizeSearchText("Amelie")).toBe(normalizeSearchText("Amélie"));
  });
});

describe("groupSearchDocs", () => {
  it("groups in year, film, person order and caps each group", () => {
    const manyFilms: SearchDoc[] = Array.from({ length: SEARCH_GROUP_LIMIT + 3 }, (_, i) => ({
      slug: "2020",
      label: `Film ${i}`,
      kind: "film" as const,
      title: `Film ${i}`,
      detail: "2020",
      won: false,
    }));
    const grouped = groupSearchDocs([
      docs[0],
      ...manyFilms,
      docs[3],
    ]);
    expect(grouped.map((group) => group.label)).toEqual(["Years", "Films", "People"]);
    expect(grouped[1]?.docs).toHaveLength(SEARCH_GROUP_LIMIT);
  });
});
