import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { checkDataDir } from "./data-check";

const validCeremony = {
  ordinal: 96,
  ceremonyYear: 2024,
  ceremonyDate: "2024-03-10",
  filmYearLabel: "2023",
  slug: "2024",
  decade: "2020s",
};

const validDetail = {
  ceremony: validCeremony,
  groups: [
    {
      id: "headline",
      label: "The Big Two",
      categories: [
        {
          id: "best-picture",
          label: "Best Picture",
          winners: [
            { names: ["Oppenheimer"], movies: [{ title: "Oppenheimer" }] },
          ],
          nominees: Array.from({ length: 12 }, (_, i) => ({
            names: [`Nominee ${i + 1}`],
            movies: [{ title: `Film ${i + 1}` }],
          })),
        },
      ],
    },
  ],
};

const validIndex = [
  {
    slug: "2024",
    label: "2024",
    subtitle: "96th Ceremony \u2014 Films of 2023",
    decade: "2020s",
    ordinal: 96,
    headline: [
      {
        category: "Best Picture",
        winner: "Oppenheimer",
        movie: "Oppenheimer",
      },
    ],
  },
];

async function writeTree(
  root: string,
  files: Record<string, unknown>,
): Promise<void> {
  for (const [relative, value] of Object.entries(files)) {
    const full = path.join(root, relative);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
}

describe("checkDataDir", () => {
  it("passes on a consistent valid tree", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "oscars-data-ok-"));
    try {
      await writeTree(dir, {
        "index.json": validIndex,
        "ceremonies/2024.json": validDetail,
      });
      await expect(checkDataDir(dir)).resolves.toBeUndefined();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });

  it("fails when a category has no winners and names the field", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "oscars-data-bad-"));
    try {
      const invalidDetail = structuredClone(validDetail);
      invalidDetail.groups[0].categories[0].winners = [];
      await writeTree(dir, {
        "index.json": validIndex,
        "ceremonies/2024.json": invalidDetail,
      });
      await expect(checkDataDir(dir)).rejects.toThrow(/winners/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
