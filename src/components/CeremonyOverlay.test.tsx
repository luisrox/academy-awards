/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ceremonyBySlug, ceremonyDateLabel, LATEST_CEREMONY } from "@/data/ceremonies";
import { getCeremonyDetail } from "@/lib/ceremony-data";
import type { CeremonyDetail } from "@/lib/types";
import { CeremonyOverlay } from "./CeremonyOverlay";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

afterEach(() => {
  cleanup();
  mockPush.mockClear();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

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

  it("exposes dialog semantics for a modal overlay", () => {
    render(<CeremonyOverlay detail={fixture()} />);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", "ceremony-heading");
  });

  it("closes to the grid on Escape", () => {
    render(<CeremonyOverlay detail={fixture()} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(mockPush).toHaveBeenCalledWith("/", { scroll: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not close when clicking the content", () => {
    render(<CeremonyOverlay detail={fixture()} />);
    fireEvent.mouseDown(screen.getByRole("heading", { level: 1 }));
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes when clicking the backdrop and restores focus to the origin card", () => {
    render(
      <>
        <button type="button" id="year-card-1929">
          1929, 1st Ceremony
        </button>
        <CeremonyOverlay detail={fixture()} />
      </>,
    );
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(mockPush).toHaveBeenCalledWith("/", { scroll: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /1929/ })).toHaveFocus();
  });

  it("keeps the next arrow in the DOM, disabled, on the 98th ceremony", () => {
    render(<CeremonyOverlay detail={fixture({ ceremony: LATEST_CEREMONY })} />);
    const next = screen.getByRole("button", { name: "Next ceremony" });
    const previous = screen.getByRole("button", { name: "Previous ceremony" });
    expect(next).toBeDisabled();
    expect(previous).toBeEnabled();
  });

  it("keeps the previous arrow in the DOM, disabled, on the 1st ceremony", () => {
    render(<CeremonyOverlay detail={fixture()} />);
    const previous = screen.getByRole("button", { name: "Previous ceremony" });
    const next = screen.getByRole("button", { name: "Next ceremony" });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();
  });

  it("navigates with arrow keys the same way as the buttons and keeps the overlay open", () => {
    const ceremony = ceremonyBySlug("2024");
    if (!ceremony) throw new Error("missing 2024");
    render(<CeremonyOverlay detail={fixture({ ceremony })} />);

    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(mockPush).toHaveBeenCalledWith("/2025", { scroll: false });
    expect(mockPush).not.toHaveBeenCalledWith("/", { scroll: false });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    mockPush.mockClear();
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(mockPush).toHaveBeenCalledWith("/2023", { scroll: false });
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    mockPush.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "Next ceremony" }));
    expect(mockPush).toHaveBeenCalledWith("/2025", { scroll: false });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not navigate past the first ceremony with ArrowLeft", () => {
    render(<CeremonyOverlay detail={fixture()} />);
    fireEvent.keyDown(document, { key: "ArrowLeft" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does not navigate past the 98th ceremony with ArrowRight", () => {
    render(<CeremonyOverlay detail={fixture({ ceremony: LATEST_CEREMONY })} />);
    fireEvent.keyDown(document, { key: "ArrowRight" });
    expect(mockPush).not.toHaveBeenCalled();
  });
});
