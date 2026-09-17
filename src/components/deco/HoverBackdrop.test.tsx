/** @vitest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { HoverBackdrop } from "./HoverBackdrop";
import { sparkLayout } from "./spark-layout";

afterEach(cleanup);

describe("HoverBackdrop", () => {
  it("renders one flash per deterministic spark and a poster slot", () => {
    const { container, rerender } = render(<HoverBackdrop slug="2026" />);
    const flashes = container.querySelectorAll("[data-hover-flash]");
    expect(flashes).toHaveLength(sparkLayout("2026").length);
    expect(container.querySelector("[data-poster-curtain]")).toBeTruthy();
    expect(container.querySelector(".hover-backdrop-vignette")).toBeTruthy();

    rerender(<HoverBackdrop slug="2026" />);
    const again = [...container.querySelectorAll("[data-hover-flash]")].map(
      (node) => (node as HTMLElement).style.left,
    );
    const first = [...flashes].map((node) => (node as HTMLElement).style.left);
    expect(again).toEqual(first);
  });

  it("renders no flashes or vignette under reduced motion", () => {
    const { container } = render(
      <HoverBackdrop slug="2026" reducedMotion />,
    );
    expect(container.querySelectorAll("[data-hover-flash]")).toHaveLength(0);
    expect(container.querySelector(".hover-backdrop-vignette")).toBeNull();
  });
});
