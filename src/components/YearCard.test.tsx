/** @vitest-environment jsdom */
import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { HEADLINE_ROTATION_MS } from "@/hooks/useHeadlineRotation";
import type { GridEntry, HeadlineWinner } from "@/lib/types";
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

vi.mock("motion/react", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => children,
  motion: {
    div: ({
      children,
      className,
    }: {
      children: ReactNode;
      className?: string;
    }) => <div className={className}>{children}</div>,
  },
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

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
      {
        category: "Best Director",
        winner: "Paul Thomas Anderson",
        movie: "One Battle after Another",
      },
      {
        category: "Best Actor",
        winner: "Michael B. Jordan",
        movie: "Sinners",
      },
      {
        category: "Best Actress",
        winner: "Jessie Buckley",
        movie: "Hamnet",
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

describe("YearCard hover rotation", () => {
  it("shows the rotating winner on mouseenter and restores rest on leave", () => {
    vi.useFakeTimers();
    render(<YearCard entry={entry()} />);
    const link = screen.getByRole("link");
    expect(vi.getTimerCount()).toBe(0);

    fireEvent.mouseEnter(link);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    expect(screen.getByText("One Battle after Another")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(HEADLINE_ROTATION_MS);
    });
    expect(screen.getByText("Paul Thomas Anderson")).toBeInTheDocument();
    expect(screen.queryByText("Best Picture")).not.toBeInTheDocument();

    fireEvent.mouseLeave(link);
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.queryByText("Paul Thomas Anderson")).not.toBeInTheDocument();
    expect(
      screen.getByText("98th Ceremony — Films of 2025"),
    ).toBeInTheDocument();
  });

  it("shows every available winner statically under reduced motion, with no timer", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    vi.useFakeTimers();
    render(<YearCard entry={entry()} />);
    expect(screen.getByText("Paul Thomas Anderson")).toBeInTheDocument();
    expect(screen.getByText("Michael B. Jordan")).toBeInTheDocument();
    expect(screen.getByText("Jessie Buckley")).toBeInTheDocument();
    fireEvent.mouseEnter(screen.getByRole("link"));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not render empty slots when only two headline winners exist", () => {
    const pair: HeadlineWinner[] = [
      { category: "Best Picture", winner: "Wings" },
      { category: "Best Director", winner: "Frank Borzage" },
    ];
    vi.useFakeTimers();
    render(<YearCard entry={entry({ headline: pair })} />);
    fireEvent.mouseEnter(screen.getByRole("link"));
    expect(screen.getByText("Wings")).toBeInTheDocument();
    expect(screen.queryByText("Best Actor")).not.toBeInTheDocument();
    expect(screen.queryByText("Best Actress")).not.toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(HEADLINE_ROTATION_MS);
    });
    expect(screen.getByText("Frank Borzage")).toBeInTheDocument();
    expect(screen.queryByText("Wings")).not.toBeInTheDocument();
  });
});
