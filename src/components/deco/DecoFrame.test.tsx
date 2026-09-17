/** @vitest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { DecoFrame } from "./DecoFrame";

afterEach(cleanup);

describe("DecoFrame", () => {
  it("applies the raised shadow class by default", () => {
    const { container } = render(<DecoFrame>Card</DecoFrame>);
    const frame = container.firstElementChild;
    expect(frame).toHaveClass("deco-frame", "deco-frame-raised", "shadow-raised");
    expect(frame).not.toHaveClass("deco-frame-flat");
  });

  it("omits the shadow class on the flat variant", () => {
    const { container } = render(<DecoFrame variant="flat">Inner</DecoFrame>);
    const frame = container.firstElementChild;
    expect(frame).toHaveClass("deco-frame", "deco-frame-flat");
    expect(frame).not.toHaveClass("deco-frame-raised");
    expect(frame).not.toHaveClass("shadow-raised");
  });
});
