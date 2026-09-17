/** @vitest-environment jsdom */
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { HeadlineWinner } from "@/lib/types";
import {
  HEADLINE_ROTATION_MS,
  useHeadlineRotation,
} from "./useHeadlineRotation";

const WINNERS: HeadlineWinner[] = [
  { category: "Best Picture", winner: "One Battle after Another" },
  { category: "Best Director", winner: "Paul Thomas Anderson" },
  { category: "Best Actor", winner: "Michael B. Jordan" },
  { category: "Best Actress", winner: "Jessie Buckley" },
];

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("useHeadlineRotation", () => {
  it("has no timer at rest", () => {
    vi.useFakeTimers();
    renderHook(() => useHeadlineRotation(WINNERS));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("starts the interval on mouseenter and rotates in spec order", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHeadlineRotation(WINNERS));

    act(() => {
      result.current.onMouseEnter();
    });
    expect(vi.getTimerCount()).toBe(1);
    expect(result.current.current?.winner).toBe("One Battle after Another");

    act(() => {
      vi.advanceTimersByTime(HEADLINE_ROTATION_MS);
    });
    expect(result.current.current?.winner).toBe("Paul Thomas Anderson");

    act(() => {
      vi.advanceTimersByTime(HEADLINE_ROTATION_MS);
    });
    expect(result.current.current?.winner).toBe("Michael B. Jordan");

    act(() => {
      vi.advanceTimersByTime(HEADLINE_ROTATION_MS);
    });
    expect(result.current.current?.winner).toBe("Jessie Buckley");
  });

  it("clears the interval on mouseleave and returns to rest from Best Picture", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useHeadlineRotation(WINNERS));

    act(() => {
      result.current.onMouseEnter();
    });
    act(() => {
      vi.advanceTimersByTime(HEADLINE_ROTATION_MS);
    });
    expect(result.current.current?.winner).toBe("Paul Thomas Anderson");

    act(() => {
      result.current.onMouseLeave();
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(result.current.hovering).toBe(false);
    expect(result.current.current).toBeUndefined();

    act(() => {
      result.current.onMouseEnter();
    });
    expect(result.current.current?.winner).toBe("One Battle after Another");
  });

  it("leaves no live timers after hovering several cards in sequence", () => {
    vi.useFakeTimers();
    const hooks = Array.from({ length: 8 }, () =>
      renderHook(() => useHeadlineRotation(WINNERS)),
    );

    for (const hook of hooks) {
      act(() => {
        hook.result.current.onMouseEnter();
      });
      expect(vi.getTimerCount()).toBe(1);
      act(() => {
        hook.result.current.onMouseLeave();
      });
      expect(vi.getTimerCount()).toBe(0);
    }

    expect(vi.getTimerCount()).toBe(0);
  });

  it("mounts no timer under reduced motion", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() =>
      useHeadlineRotation(WINNERS, { reducedMotion: true }),
    );
    act(() => {
      result.current.onMouseEnter();
    });
    expect(vi.getTimerCount()).toBe(0);
    expect(result.current.current).toBeUndefined();
    expect(result.current.reducedMotion).toBe(true);
  });

  it("rotates only among the winners that exist", () => {
    vi.useFakeTimers();
    const pair = WINNERS.slice(0, 2);
    const { result } = renderHook(() => useHeadlineRotation(pair));
    act(() => {
      result.current.onMouseEnter();
    });
    act(() => {
      vi.advanceTimersByTime(HEADLINE_ROTATION_MS);
    });
    expect(result.current.current?.winner).toBe("Paul Thomas Anderson");
    act(() => {
      vi.advanceTimersByTime(HEADLINE_ROTATION_MS);
    });
    expect(result.current.current?.winner).toBe("One Battle after Another");
    expect(result.current.current?.winner).not.toBe("Michael B. Jordan");
  });
});
