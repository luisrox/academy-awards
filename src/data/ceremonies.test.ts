import { describe, expect, it } from "vitest";
import { ordinalSuffix } from "./ceremonies";

describe("ordinalSuffix", () => {
  it.each([
    [1, "1st"],
    [2, "2nd"],
    [3, "3rd"],
    [4, "4th"],
    [11, "11th"],
    [12, "12th"],
    [13, "13th"],
    [21, "21st"],
    [22, "22nd"],
    [23, "23rd"],
    [98, "98th"],
    [101, "101st"],
    [111, "111th"],
  ] as const)("%s becomes %s", (n, expected) => {
    expect(ordinalSuffix(n)).toBe(expected);
  });
});
