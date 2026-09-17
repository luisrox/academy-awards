import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "layout.tsx"),
  "utf8",
);

describe("root font loading", () => {
  it("uses display swap so a cold cache still applies Playfair and Inter", () => {
    expect(src).toMatch(/Playfair_Display\({[\s\S]*?display:\s*"swap"/);
    expect(src).toMatch(/Inter\({[\s\S]*?display:\s*"swap"/);
    expect(src).not.toMatch(/display:\s*"optional"/);
    expect(src).not.toMatch(/preload:\s*false/);
  });
});
