import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { REPO_ROOT } from "../../scripts/lib/cache";
import { blendHex, contrastRatio } from "./contrast";
import { AA_CONTRAST_MIN, PALETTE, TEXT_TOKENS } from "./palette";

const CSS_TOKEN = {
  ink: "--color-ink",
  surface: "--color-surface",
  gold: "--color-gold",
  goldLight: "--color-gold-light",
  muted: "--color-muted",
} as const;

function tokenFromCss(css: string, name: string): string {
  const match = css.match(new RegExp(`${name}:\\s*(#[0-9A-Fa-f]{6})`));
  if (!match) {
    throw new Error(`Missing ${name} in globals.css`);
  }
  return match[1];
}

describe("contrast helpers", () => {
  it("gives black on white a ratio of 21", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });
});

describe("text palette on Art Deco surfaces", () => {
  const css = readFileSync(
    path.join(REPO_ROOT, "src/app/globals.css"),
    "utf8",
  );
  const surface = tokenFromCss(css, CSS_TOKEN.surface);
  const ink = tokenFromCss(css, CSS_TOKEN.ink);

  it("keeps CSS variables in lockstep with the palette module", () => {
    expect(ink).toBe(PALETTE.ink);
    expect(surface).toBe(PALETTE.surface);
    expect(tokenFromCss(css, CSS_TOKEN.gold)).toBe(PALETTE.gold);
    expect(tokenFromCss(css, CSS_TOKEN.goldLight)).toBe(PALETTE.goldLight);
    expect(tokenFromCss(css, CSS_TOKEN.muted)).toBe(PALETTE.muted);
  });

  it("gives muted-on-surface at least AA contrast (the typical failure of this palette)", () => {
    const muted = tokenFromCss(css, CSS_TOKEN.muted);
    expect(contrastRatio(muted, surface)).toBeGreaterThanOrEqual(AA_CONTRAST_MIN);
  });

  it("gives every text token at least AA contrast on surface and ink", () => {
    for (const [name, hex] of Object.entries(TEXT_TOKENS)) {
      expect(contrastRatio(hex, surface), `${name} on surface`).toBeGreaterThanOrEqual(
        AA_CONTRAST_MIN,
      );
      expect(contrastRatio(hex, ink), `${name} on ink`).toBeGreaterThanOrEqual(
        AA_CONTRAST_MIN,
      );
    }
  });

  it("keeps AA contrast when the gold hover vignette sits over the raised face", () => {
    const raisedFace = "#191612";
    const hovered = blendHex(PALETTE.gold, raisedFace, 0.14);
    for (const [name, hex] of Object.entries(TEXT_TOKENS)) {
      expect(
        contrastRatio(hex, hovered),
        `${name} on hover vignette`,
      ).toBeGreaterThanOrEqual(AA_CONTRAST_MIN);
    }
  });
});
