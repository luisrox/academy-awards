/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Emblem } from "./Emblem";

afterEach(cleanup);

const source = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "Emblem.tsx"),
  "utf8",
);

describe("Emblem", () => {
  it("renders at the requested size", () => {
    const { container } = render(<Emblem size={32} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
    expect(svg).toHaveAttribute("viewBox", "0 0 64 64");
  });

  it("is aria-hidden by default and named when it stands alone", () => {
    const { rerender } = render(<Emblem />);
    expect(document.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    rerender(<Emblem title="Oscars Winners emblem" />);
    expect(screen.getByRole("img", { name: "Oscars Winners emblem" })).toBeInTheDocument();
  });

  it("documents the four distinction rules and contains no human-figure markup", () => {
    // Reminder of spec.md 8.6, not a legal guarantee that the drawing is safe.
    expect(source).toMatch(/figura humana/);
    expect(source).toMatch(/espada/);
    expect(source).toMatch(/carrete/);
    expect(source).toMatch(/proporciones de la estatuilla/);
    expect(source).not.toMatch(/\b(human|person|knight|sword|crusader|statuette)\b/i);
  });
});
