/** @vitest-environment jsdom */
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { decadeBuckets } from "@/data/ceremonies";
import { getGridEntries } from "@/lib/ceremony-data";
import { DecadeNav, decadeSectionId } from "./DecadeNav";
import { YearGrid } from "./YearGrid";

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    scroll,
    ...props
  }: {
    href: string;
    children: ReactNode;
    scroll?: boolean;
    className?: string;
    "aria-label"?: string;
  }) {
    return (
      <a href={href} data-scroll={scroll === false ? "false" : undefined} {...props}>
        {children}
      </a>
    );
  },
}));

afterEach(cleanup);

const entries = getGridEntries();
const decades = decadeBuckets().map((bucket) => bucket.decade);

function yearLinks(): HTMLAnchorElement[] {
  return screen
    .getAllByRole("link")
    .filter((link): link is HTMLAnchorElement =>
      Boolean(link.getAttribute("href")?.match(/^\/\d/)),
    );
}

describe("YearGrid", () => {
  it("renders 98 year cards, 98th first and 1st last", () => {
    render(<YearGrid entries={entries} />);
    const links = yearLinks();
    expect(links).toHaveLength(98);
    expect(links[0]).toHaveAttribute("href", "/2026");
    expect(links[0]).toHaveAccessibleName(/98th Ceremony/i);
    expect(links[97]).toHaveAttribute("href", "/1929");
    expect(links[97]).toHaveAccessibleName(/1st Ceremony/i);
  });

  it("renders a sticky heading and separator for each decade", () => {
    render(<YearGrid entries={entries} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((heading) => heading.textContent)).toEqual(decades);
    expect(screen.getAllByRole("separator")).toHaveLength(decades.length);
    expect(document.querySelector("#decade-2020s ul")?.className).toMatch(
      /\bpt-2\b/,
    );
  });

  it("puts exactly one card in the 1920s, per spec 5.5", () => {
    render(<YearGrid entries={entries} />);
    const twenties = document.getElementById(decadeSectionId("1920s"));
    expect(twenties).toBeTruthy();
    expect(twenties?.querySelectorAll("a")).toHaveLength(1);
    expect(twenties).toHaveTextContent("1929");
  });
});

describe("DecadeNav with the grid", () => {
  it("points every decade jump at a section that exists", () => {
    render(
      <>
        <DecadeNav decades={decades} />
        <YearGrid entries={entries} />
      </>,
    );
    const nav = screen.getByRole("navigation", { name: "Decades" });
    expect(nav.querySelector("ul")?.className).toMatch(/overflow-x-auto/);
    const jumps = nav.querySelectorAll("a");
    expect(jumps.length).toBe(decades.length);
    for (const jump of jumps) {
      const id = jump.getAttribute("href")?.slice(1);
      expect(id, jump.textContent ?? "").toBeTruthy();
      expect(document.getElementById(id!)).not.toBeNull();
    }
  });
});
