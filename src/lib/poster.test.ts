import { describe, expect, it } from "vitest";
import { posterMonogram } from "./poster";

describe("posterMonogram", () => {
  it("uses initials from the title", () => {
    expect(posterMonogram("One Battle after Another")).toBe("OB");
    expect(posterMonogram("Oppenheimer")).toBe("OP");
    expect(posterMonogram("The Godfather")).toBe("GO");
  });
});
