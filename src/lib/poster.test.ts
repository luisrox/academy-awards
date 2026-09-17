import { describe, expect, it } from "vitest";
import { pictureMonogram } from "./poster";

describe("pictureMonogram", () => {
  it("uses initials from a title", () => {
    expect(pictureMonogram("One Battle after Another")).toBe("OB");
    expect(pictureMonogram("Oppenheimer")).toBe("OP");
    expect(pictureMonogram("The Godfather")).toBe("GO");
  });

  it("handles a one-word name and a three-word name", () => {
    expect(pictureMonogram("Cher")).toBe("CH");
    expect(pictureMonogram("Pedro Almodóvar Caballero")).toBe("PA");
  });
});
