/** @vitest-environment jsdom */
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { GridEntry } from "@/lib/types";
import { YearCard } from "./YearCard";

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

function entry(overrides: Partial<GridEntry> = {}): GridEntry {
  return {
    slug: "2026",
    label: "2026",
    subtitle: "98th Ceremony — Films of 2025",
    decade: "2020s",
    ordinal: 98,
    headline: [
      {
        category: "Best Picture",
        winner: "One Battle after Another",
        movie: "One Battle after Another",
      },
    ],
    ...overrides,
  };
}

describe("YearCard in rest", () => {
  it("renders the ceremony year and subtitle", () => {
    render(<YearCard entry={entry()} />);
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(
      screen.getByText("98th Ceremony — Films of 2025"),
    ).toBeInTheDocument();
  });

  it("is a link to the slug, including ambiguous 1930-2nd", () => {
    const { rerender } = render(<YearCard entry={entry()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/2026");

    rerender(
      <YearCard
        entry={entry({
          slug: "1930-2nd",
          label: "1930",
          subtitle: "2nd Ceremony — Films of 1929",
          ordinal: 2,
        })}
      />,
    );
    expect(screen.getByRole("link")).toHaveAttribute("href", "/1930-2nd");
  });

  it("does not show the headline winner at rest", () => {
    render(<YearCard entry={entry()} />);
    expect(
      screen.queryByText("One Battle after Another"),
    ).not.toBeInTheDocument();
  });

  it("is a keyboard-focusable link with an accessible name", () => {
    render(<YearCard entry={entry()} />);
    const link = screen.getByRole("link", {
      name: /2026.*98th Ceremony/i,
    });
    expect(link.tagName).toBe("A");
    expect(link).not.toHaveAttribute("tabindex", "-1");
  });
});
