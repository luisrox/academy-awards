/** @vitest-environment jsdom */
import { useState } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { useOverlay } from "./useOverlay";

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
});

function OverlayHarness({
  onClose,
  returnFocus,
}: {
  onClose?: () => void;
  returnFocus?: string | HTMLElement | (() => HTMLElement | null);
}) {
  const [open, setOpen] = useState(true);
  const close = () => {
    onClose?.();
    setOpen(false);
  };
  const { overlayRef, contentRef } = useOverlay({
    isOpen: open,
    onClose: close,
    returnFocus,
  });

  return (
    <div>
      <button type="button" id="origin">
        Origin
      </button>
      {open ? (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          tabIndex={-1}
          data-testid="overlay"
        >
          <div ref={contentRef} data-testid="content">
            <button type="button">First</button>
            <button type="button">Last</button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

describe("useOverlay", () => {
  it("closes on Escape", () => {
    const onClose = vi.fn();
    render(<OverlayHarness onClose={onClose} />);

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves Tab from the last focusable back to the first", () => {
    render(<OverlayHarness />);
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    last.focus();
    act(() => {
      fireEvent.keyDown(document, { key: "Tab" });
    });

    expect(first).toHaveFocus();
  });

  it("moves Shift+Tab from the first focusable to the last", () => {
    render(<OverlayHarness />);
    const first = screen.getByRole("button", { name: "First" });
    const last = screen.getByRole("button", { name: "Last" });

    first.focus();
    act(() => {
      fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    });

    expect(last).toHaveFocus();
  });

  it("restores focus to the origin element on close", () => {
    render(<OverlayHarness returnFocus="#origin" />);
    const origin = screen.getByRole("button", { name: "Origin" });

    expect(screen.getByRole("dialog")).toHaveFocus();

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(origin).toHaveFocus();
  });

  it("locks background scroll while open and restores it after Escape", () => {
    document.body.style.overflow = "scroll";
    document.documentElement.style.overflow = "scroll";

    render(<OverlayHarness />);
    expect(document.body.style.overflow).toBe("hidden");
    expect(document.documentElement.style.overflow).toBe("hidden");

    act(() => {
      fireEvent.keyDown(document, { key: "Escape" });
    });

    expect(document.body.style.overflow).toBe("scroll");
    expect(document.documentElement.style.overflow).toBe("scroll");
  });

  it("does not close when clicking inside the content", () => {
    const onClose = vi.fn();
    render(<OverlayHarness onClose={onClose} />);

    fireEvent.mouseDown(screen.getByTestId("content"));
    fireEvent.mouseDown(screen.getByRole("button", { name: "First" }));

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes when clicking outside the content", () => {
    const onClose = vi.fn();
    render(<OverlayHarness onClose={onClose} />);

    fireEvent.mouseDown(screen.getByTestId("overlay"));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
