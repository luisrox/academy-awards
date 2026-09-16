/** @vitest-environment jsdom */
import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import NotFound from "./not-found";

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

afterEach(cleanup);

describe("not-found", () => {
  it("renders a site-styled unknown slug page with a link back to the grid", () => {
    render(<NotFound />);
    expect(
      screen.getByRole("heading", { name: /not in the record/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to the grid/i })).toHaveAttribute(
      "href",
      "/",
    );
  });
});
