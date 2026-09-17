/** @vitest-environment jsdom */
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { SiteHeader } from "./SiteHeader";

vi.mock("next/link", () => ({
  default: function MockLink({
    href,
    children,
    ...props
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("./SearchPalette", () => ({
  SearchPalette: () => <div data-slot="search" />,
}));

afterEach(cleanup);

describe("SiteHeader lockup", () => {
  it("hides the emblem from assistive tech because the site name is already written", () => {
    render(<SiteHeader />);
    const lockup = screen.getByRole("link", { name: "Oscars Winners" });
    const emblem = lockup.querySelector("svg");
    expect(emblem).toBeTruthy();
    expect(emblem).toHaveAttribute("aria-hidden", "true");
  });
});
