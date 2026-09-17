/** @vitest-environment jsdom */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { SearchDoc } from "@/lib/types";
import { clearSearchIndexCache } from "@/lib/load-search-index";
import { SearchPalette } from "./SearchPalette";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/link", async () => {
  const { forwardRef } = await import("react");
  return {
    default: forwardRef<
      HTMLAnchorElement,
      {
        href: string;
        children: ReactNode;
        scroll?: boolean;
        className?: string;
        id?: string;
        role?: string;
        "aria-selected"?: boolean;
        onClick?: () => void;
      }
    >(function MockLink({ href, children, scroll, ...props }, ref) {
      return (
        <a
          ref={ref}
          href={href}
          data-scroll={scroll === false ? "false" : undefined}
          {...props}
        >
          {children}
        </a>
      );
    }),
  };
});

const INDEX: SearchDoc[] = [
  {
    slug: "2026",
    label: "2026",
    kind: "year",
    title: "2026",
    detail: "98th Ceremony — Films of 2025",
    won: false,
  },
  {
    slug: "2020",
    label: "Parasite",
    kind: "film",
    title: "Parasite",
    detail: "2020",
    won: true,
  },
  {
    slug: "2002",
    label: "Amélie",
    kind: "film",
    title: "Amélie",
    detail: "2002",
    won: false,
  },
  {
    slug: "2024",
    label: "Cillian Murphy",
    kind: "person",
    title: "Cillian Murphy",
    detail: "2024",
    won: true,
  },
  {
    slug: "2024",
    label: "Jane Doe",
    kind: "person",
    title: "Jane Doe",
    detail: "2024",
    won: true,
  },
  {
    slug: "2025",
    label: "Jane Smith",
    kind: "person",
    title: "Jane Smith",
    detail: "2025",
    won: false,
  },
];

function mockFetchOk(data: SearchDoc[] = INDEX) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    }),
  );
}

afterEach(() => {
  cleanup();
  clearSearchIndexCache();
  mockPush.mockClear();
  vi.unstubAllGlobals();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

async function openPalette() {
  fireEvent.click(screen.getByRole("button", { name: /open search/i }));
  await waitFor(() => {
    expect(screen.getByRole("combobox", { name: /search/i })).toBeInTheDocument();
  });
}

async function openLoadedPalette() {
  await openPalette();
  await waitFor(() => {
    expect(screen.getByText(/Type a year, film, or person/)).toBeInTheDocument();
  });
}

describe("SearchPalette", () => {
  it("does not import the search index into the client module", () => {
    const source = readFileSync(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "SearchPalette.tsx"),
      "utf8",
    );
    expect(source).not.toContain("data/search.json");
    expect(source).not.toContain("getSearchIndex");
    expect(source).not.toMatch(/from ["']@\/lib\/ceremony-data["']/);
  });

  it("does not fetch the index until the palette opens", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<SearchPalette />);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Search" })).not.toBeInTheDocument();

    mockFetchOk();
    await openPalette();
    expect(fetch).toHaveBeenCalledWith("/search.json");
  });

  it("finds a year, a film winner, a film nominee, and a person", async () => {
    mockFetchOk();
    render(<SearchPalette />);
    await openLoadedPalette();
    const input = screen.getByRole("combobox", { name: /search/i });

    fireEvent.change(input, { target: { value: "2026" } });
    expect(screen.getByRole("group", { name: "Years" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /2026/ })).toHaveAttribute(
      "href",
      "/2026",
    );

    fireEvent.change(input, { target: { value: "Parasite" } });
    expect(screen.getByRole("group", { name: "Films" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Parasite/ })).toHaveTextContent("Winner");

    fireEvent.change(input, { target: { value: "Amelie" } });
    expect(screen.getByRole("option", { name: /Amélie/ })).toHaveTextContent("Nominee");

    fireEvent.change(input, { target: { value: "Cillian" } });
    expect(screen.getByRole("group", { name: "People" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Cillian Murphy/ })).toHaveTextContent(
      "Winner",
    );
  });

  it("navigates to the edition on Enter and walks results with arrows", async () => {
    mockFetchOk();
    render(<SearchPalette />);
    await openLoadedPalette();
    const input = screen.getByRole("combobox", { name: /search/i });
    fireEvent.change(input, { target: { value: "Jane" } });

    const first = screen.getByRole("option", { name: /Jane Doe/ });
    const second = screen.getByRole("option", { name: /Jane Smith/ });
    expect(first).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveAttribute("aria-selected", "false");

    act(() => {
      fireEvent.keyDown(document, { key: "ArrowDown" });
    });
    expect(second).toHaveAttribute("aria-selected", "true");

    act(() => {
      fireEvent.keyDown(document, { key: "Enter" });
    });
    expect(mockPush).toHaveBeenCalledWith("/2025", { scroll: false });
    expect(screen.queryByRole("dialog", { name: "Search" })).not.toBeInTheDocument();
  });

  it("opens from / and closes on Escape", async () => {
    mockFetchOk();
    render(<SearchPalette />);
    act(() => {
      fireEvent.keyDown(document, { key: "/" });
    });
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: /search/i })).toHaveFocus();
    });

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });
    expect(screen.queryByRole("dialog", { name: "Search" })).not.toBeInTheDocument();
  });

  it("shows a retryable error without taking down the rest of the page", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500, json: async () => null })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => INDEX,
      });
    vi.stubGlobal("fetch", fetchMock);

    render(
      <>
        <article id="year-card-2026">2026</article>
        <SearchPalette />
      </>,
    );
    await openPalette();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /search index failed to load/i,
    );
    expect(screen.getByText("2026")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    fireEvent.change(await screen.findByRole("combobox", { name: /search/i }), {
      target: { value: "Parasite" },
    });
    await waitFor(() => {
      expect(screen.getByRole("option", { name: /Parasite/ })).toBeInTheDocument();
    });
  });
});
