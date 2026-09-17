/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { ImageMonogram } from "./ImageMonogram";

vi.mock("next/image", () => ({
  default: function MockImage({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    className?: string;
  }) {
    // eslint-disable-next-line @next/next/no-img-element -- jsdom stand-in for next/image
    return <img src={src} alt={alt} width={width} height={height} className={className} />;
  },
}));

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

describe("ImageMonogram lightbox", () => {
  it("opens a large view from a poster and closes on Escape", () => {
    render(
      <ImageMonogram
        slot="poster"
        src="/images/posters/872585.webp"
        label="Oppenheimer"
        width={144}
        height={216}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Oppenheimer/i }));
    const dialog = screen.getByRole("dialog", { name: "Oppenheimer" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog.querySelector("img")).toHaveAttribute(
      "src",
      "/images/posters/872585.webp",
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens a portrait and closes when clicking the backdrop", () => {
    render(
      <ImageMonogram
        slot="portrait"
        src="/images/people/1.webp"
        label="Christopher Nolan"
        width={56}
        height={56}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Christopher Nolan/i }),
    );
    fireEvent.mouseDown(screen.getByRole("dialog"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("does not make a monogram fallback clickable", () => {
    render(
      <ImageMonogram
        slot="poster"
        label="One Battle after Another"
        width={144}
        height={216}
      />,
    );

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(document.querySelector("[data-poster-slot]")).toHaveAttribute(
      "data-image-fallback",
      "monogram",
    );
  });
});
