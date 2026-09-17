import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const css = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "globals.css"),
  "utf8",
);

function layerBody(name: string): string {
  const marker = `@layer ${name}`;
  const start = css.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < css.length; i += 1) {
    if (css[i] === "{") depth += 1;
    if (css[i] === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, i);
    }
  }
  throw new Error(`Unclosed @layer ${name}`);
}

describe("CSS cascade layers", () => {
  it("keeps custom classes inside @layer components so utilities can override them", () => {
    const components = layerBody("components");
    const beforeComponents = css.slice(0, css.indexOf("@layer components"));

    expect(components).toMatch(/\.deco-frame\s*\{[^}]*position:\s*relative/);
    expect(components).toMatch(/\.deco-grain\s*\{/);
    expect(beforeComponents).not.toMatch(/\.deco-frame\s*\{/);
    expect(beforeComponents).not.toMatch(/\.deco-grain\s*\{/);
  });
});
