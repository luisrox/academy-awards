/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SiteFooter } from "./SiteFooter";

afterEach(cleanup);

describe("SiteFooter", () => {
  it("states that this is an unofficial site", () => {
    render(<SiteFooter />);
    expect(screen.getByText(/unofficial fan site/i)).toBeInTheDocument();
    expect(screen.getByText(/not affiliated/i)).toBeInTheDocument();
  });

  it("credits TMDB as required by its license", () => {
    render(<SiteFooter />);
    expect(
      screen.getByText(/uses the TMDB API but is not endorsed/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /themoviedb\.org/i }),
    ).toHaveAttribute("href", "https://www.themoviedb.org");
  });
});
