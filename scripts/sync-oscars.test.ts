import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatOfficialDiff, syncOscars } from "./sync-oscars";
import type { NominationRecord } from "./lib/load-historical";

function officialHtml(
  categories: { title: string; person: string; film: string }[],
): string {
  return categories
    .map(
      (category) => `
<div class="result-subgroup subgroup-awardcategory-chron">
  <div class="result-subgroup-title"><a class="nominations-link">${category.title}</a></div>
  <div class="result-details">
    <span class="glyphicon-star"></span>
    <div class="awards-result-nominationstatement">${category.person}</div>
    <div class="awards-result-film-title">${category.film}</div>
  </div>
</div>`,
    )
    .join("\n");
}

const FULL_HTML = officialHtml([
  { title: "BEST PICTURE", person: "Producers", film: "Cool Film" },
  { title: "ACTOR", person: "Lead Actor", film: "Cool Film" },
]);

const SPARSE_HTML = officialHtml([
  { title: "BEST PICTURE", person: "Producers", film: "Only Film" },
]);

function htmlResponse(status: number, body = FULL_HTML): Response {
  return new Response(body, { status, headers: { "content-type": "text/html" } });
}

describe("syncOscars", () => {
  let cacheDir: string;
  let rawDir: string;

  beforeEach(async () => {
    cacheDir = await mkdtemp(path.join(os.tmpdir(), "oscars-cache-"));
    rawDir = await mkdtemp(path.join(os.tmpdir(), "oscars-raw-"));
  });

  afterEach(async () => {
    await rm(cacheDir, { recursive: true, force: true });
    await rm(rawDir, { recursive: true, force: true });
  });

  function run(
    fetchImpl: typeof fetch,
    overrides: Partial<Parameters<typeof syncOscars>[0]> = {},
  ) {
    return syncOscars({
      ordinal: 98,
      cacheDir,
      rawDir,
      fetchImpl,
      sleep: async () => undefined,
      log: () => undefined,
      ...overrides,
    });
  }

  it("retries a 500 and succeeds after later 200s", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(htmlResponse(500, "error"))
      .mockResolvedValueOnce(htmlResponse(200))
      .mockResolvedValueOnce(htmlResponse(200));

    const result = await run(fetchImpl);

    expect(result.written).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    const raw = await readFile(
      path.join(rawDir, "official-98.json"),
      "utf8",
    );
    expect(JSON.parse(raw)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryId: "best-picture", won: true }),
      ]),
    );
  });

  it("aborts after three 500s with the status code in the message", async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(htmlResponse(500));

    await expect(run(fetchImpl)).rejects.toThrow(/500/);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    await expect(
      readFile(path.join(rawDir, "official-98.json"), "utf8"),
    ).rejects.toThrow();
  });

  it("writes a sparse edition but marks the output as suspicious", async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValue(htmlResponse(200, SPARSE_HTML));
    const lines: string[] = [];

    const result = await run(fetchImpl, {
      log: (line) => lines.push(line),
    });

    expect(result.written).toBe(true);
    expect(result.suspicious).toBe(true);
    expect(lines.join("\n")).toMatch(/suspicious/i);
    const raw = JSON.parse(
      await readFile(path.join(rawDir, "official-98.json"), "utf8"),
    ) as unknown[];
    expect(raw).toHaveLength(1);
  });

  it("does not overwrite an existing file without confirmation", async () => {
    const dest = path.join(rawDir, "official-98.json");
    await mkdir(rawDir, { recursive: true });
    await writeFile(dest, "UNTOUCHED\n", "utf8");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(htmlResponse(200));

    await expect(run(fetchImpl)).rejects.toThrow(/overwrite/i);
    expect(await readFile(dest, "utf8")).toBe("UNTOUCHED\n");
  });

  it("prints a readable category and winner diff before refusing to overwrite", async () => {
    const dest = path.join(rawDir, "official-98.json");
    await mkdir(rawDir, { recursive: true });
    await writeFile(
      dest,
      `${JSON.stringify([
        {
          ordinal: 98,
          categoryId: "best-picture",
          categoryLabel: "Best Picture",
          names: ["Old Picture"],
          movies: [{ title: "Old Picture" }],
          won: true,
        },
      ])}\n`,
      "utf8",
    );
    const lines: string[] = [];
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(htmlResponse(200));

    await expect(run(fetchImpl, { log: (line) => lines.push(line) })).rejects.toThrow(
      /overwrite/i,
    );
    const diff = lines.join("\n");
    expect(diff).toMatch(/Nominations:/);
    expect(diff).toMatch(/Categories:/);
    expect(diff).toMatch(/Winner changes:/);
    expect(diff).toMatch(/best-picture: Old Picture \(Old Picture\) →/);
    expect(diff).toMatch(/--yes/);
    expect(await readFile(dest, "utf8")).toMatch(/Old Picture/);
  });

  it("overwrites an existing file when confirmation is passed", async () => {
    const dest = path.join(rawDir, "official-98.json");
    await mkdir(rawDir, { recursive: true });
    await writeFile(dest, "UNTOUCHED\n", "utf8");
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(htmlResponse(200));

    const result = await run(fetchImpl, { confirmOverwrite: true });
    expect(result.written).toBe(true);
    const raw = JSON.parse(await readFile(dest, "utf8")) as unknown[];
    expect(raw.length).toBeGreaterThan(0);
  });
});

describe("formatOfficialDiff", () => {
  const picture = (title: string, won = true): NominationRecord => ({
    ordinal: 98,
    categoryId: "best-picture",
    categoryLabel: "Best Picture",
    names: [title],
    movies: [{ title }],
    won,
  });

  it("lists added categories and winner changes", () => {
    const diff = formatOfficialDiff(
      "data/raw/official-98.json",
      [picture("Old Picture")],
      [
        picture("New Picture"),
        {
          ordinal: 98,
          categoryId: "best-casting",
          categoryLabel: "Best Casting",
          names: ["A Caster"],
          movies: [{ title: "New Picture" }],
          won: true,
        },
      ],
    );
    expect(diff).toMatch(/Nominations: 1 → 2/);
    expect(diff).toMatch(/Added: best-casting/);
    expect(diff).toMatch(
      /best-picture: Old Picture \(Old Picture\) → New Picture \(New Picture\)/,
    );
  });
});
