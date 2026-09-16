/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ceremonyDateLabel } from "@/data/ceremonies";
import { getCeremonyDetail } from "@/lib/ceremony-data";
import type { CeremonyDetail } from "@/lib/types";
import { CeremonyOverlay } from "./CeremonyOverlay";

afterEach(cleanup);

function fixture(overrides: Partial<CeremonyDetail> = {}): CeremonyDetail {
  return {
    ceremony: {
      ordinal: 1,
      ceremonyYear: 1929,
      ceremonyDate: "1929-05-16",
      filmYearLabel: "1927/28",
      slug: "1929",
      decade: "1920s",
    },
    groups: [
      {
        id: "headline",
        label: "The Big Two",
        categories: [
          {
            id: "best-picture",
            label: "Best Picture",
            winners: [{ names: ["Wings"], movies: [{ title: "Wings" }] }],
            nominees: [
              { names: ["The Racket"], movies: [{ title: "The Racket" }] },
            ],
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe("CeremonyOverlay", () => {
  it("renders ceremony year, edition, film year, exact date, and a poster slot", () => {
    const detail = getCeremonyDetail("2024");
    if (!detail) throw new Error("missing 2024 fixture");
    render(<CeremonyOverlay detail={detail} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "2024" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/96th Ceremony/i)).toBeInTheDocument();
    expect(screen.getByText(/Films of 2023/i)).toBeInTheDocument();
    expect(
      screen.getByText(ceremonyDateLabel(detail.ceremony)),
    ).toBeInTheDocument();
    expect(document.querySelector("[data-poster-slot]")).toBeTruthy();
  });

  it("renders a modern edition's groups in dictionary order, starting with the headline block", () => {
    const detail = getCeremonyDetail("2024");
    if (!detail) throw new Error("missing 2024 fixture");
    render(<CeremonyOverlay detail={detail} />);

    const groupHeadings = screen.getAllByRole("heading", { level: 2 });
    expect(groupHeadings.map((heading) => heading.textContent)).toEqual(
      detail.groups.map((group) => group.label),
    );
    expect(groupHeadings[0]).toHaveTextContent("The Big Two");
  });

  it("does not render empty groups for the 1935 ceremony", () => {
    const detail = getCeremonyDetail("1935");
    if (!detail) throw new Error("missing 1935 fixture");
    render(<CeremonyOverlay detail={detail} />);

    expect(detail.groups.map((group) => group.id)).not.toContain("feature");
    expect(
      screen.queryByRole("heading", { name: /^Features$/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^The Big Two$/ })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /^Retired Categories$/ }),
    ).toBeInTheDocument();
  });

  it("distinguishes winner and nominees by size and type, not only color", () => {
    render(<CeremonyOverlay detail={fixture()} />);

    const winner = screen.getByText("Wings").closest("[data-entry-role='winner']");
    const nominee = screen
      .getByText("The Racket")
      .closest("[data-entry-role='nominee']");

    expect(winner).toBeTruthy();
    expect(nominee).toBeTruthy();
    expect(winner?.className).toMatch(/font-display/);
    expect(winner?.className).toMatch(/text-(2xl|3xl|4xl|5xl)/);
    expect(nominee?.className).toMatch(/font-sans/);
    expect(nominee?.className).toMatch(/text-(xs|sm)/);
  });

  it("does not render a Nominees heading when a category has only a winner", () => {
    render(
      <CeremonyOverlay
        detail={fixture({
          groups: [
            {
              id: "craft",
              label: "Crafts",
              categories: [
                {
                  id: "best-sound-editing",
                  label: "Best Sound Effects Editing",
                  winners: [
                    {
                      names: ["Stephen Hunter Flick", "John Pospisil"],
                      movies: [{ title: "RoboCop" }],
                    },
                  ],
                  nominees: [],
                },
              ],
            },
          ],
        })}
      />,
    );

    expect(screen.getByText("Stephen Hunter Flick, John Pospisil")).toBeInTheDocument();
    expect(screen.getByText("RoboCop")).toBeInTheDocument();
    expect(screen.queryByText(/^Nominees$/i)).not.toBeInTheDocument();
  });

  it("renders both winners of a tie", () => {
    const detail = getCeremonyDetail("1969");
    if (!detail) throw new Error("missing 1969 fixture");
    render(<CeremonyOverlay detail={detail} />);

    const actress = screen
      .getByRole("heading", { name: /^Best Actress$/ })
      .closest("section");
    if (!actress) throw new Error("Best Actress section missing");

    const winners = within(actress)
      .getAllByText(/Katharine Hepburn|Barbra Streisand/)
      .map((node) => node.closest("[data-entry-role='winner']"))
      .filter(Boolean);

    expect(within(actress).getByText("Katharine Hepburn")).toBeInTheDocument();
    expect(within(actress).getByText("Barbra Streisand")).toBeInTheDocument();
    expect(winners).toHaveLength(2);
  });

  it("renders a nomination with no movie without breaking", () => {
    render(
      <CeremonyOverlay
        detail={fixture({
          groups: [
            {
              id: "craft",
              label: "Crafts",
              categories: [
                {
                  id: "best-sound",
                  label: "Best Sound Recording",
                  winners: [
                    {
                      names: ["Paramount Publix Studio Sound Department"],
                      movies: [],
                    },
                  ],
                  nominees: [
                    { names: ["MGM Studio Sound Department"], movies: [] },
                  ],
                },
              ],
            },
          ],
        })}
      />,
    );

    expect(
      screen.getByText("Paramount Publix Studio Sound Department"),
    ).toBeInTheDocument();
    expect(screen.getByText("MGM Studio Sound Department")).toBeInTheDocument();
  });

  it("exposes a sticky desktop index of groups", () => {
    const detail = getCeremonyDetail("2024");
    if (!detail) throw new Error("missing 2024 fixture");
    render(<CeremonyOverlay detail={detail} />);

    const nav = screen.getByRole("navigation", { name: "Category groups" });
    expect(nav.className).toMatch(/sticky/);
    expect(nav.className).toMatch(/lg:block/);

    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual(
      detail.groups.map((group) => `#group-${group.id}`),
    );
  });
});
