/** @vitest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { HoverBackdrop } from "./HoverBackdrop";
import { sparkLayout } from "./spark-layout";

vi.mock("next/image", () => ({
  default: function MockImage({ src, alt }: { src: string; alt: string }) {
    // eslint-disable-next-line @next/next/no-img-element -- jsdom stand-in for next/image
    return <img src={src} alt={alt} />;
  },
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

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

  it("renders the Best Picture poster inside the 8% curtain", () => {
    const { container } = render(
      <HoverBackdrop slug="2024" posterPath="/images/posters/872585.webp" />,
    );
    const curtain = container.querySelector("[data-poster-curtain='ready']");
    expect(curtain?.querySelector("img")).toHaveAttribute(
      "src",
      "/images/posters/872585.webp",
    );
  });

  it("renders no flashes or vignette under reduced motion", () => {
    const { container } = render(
      <HoverBackdrop slug="2026" reducedMotion />,
    );
    expect(container.querySelectorAll("[data-hover-flash]")).toHaveLength(0);
    expect(container.querySelector(".hover-backdrop-vignette")).toBeNull();
  });

  it("does not mount JavaScript timers", () => {
    vi.useFakeTimers();
    render(<HoverBackdrop slug="2026" posterPath="/images/posters/1.webp" />);
    expect(vi.getTimerCount()).toBe(0);
    vi.useRealTimers();
  });
});
