import { useCallback, useEffect, useRef, useState } from "react";
import type { HeadlineWinner } from "@/lib/types";

/** Visible duration of each headline winner while hovering, spec.md 6.1. */
export const HEADLINE_ROTATION_MS = 1600;

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export type HeadlineRotation = {
  hovering: boolean;
  reducedMotion: boolean;
  index: number;
  current: HeadlineWinner | undefined;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  start: () => void;
  stop: () => void;
};

/**
 * Hover rotation for YearCard. The interval is created on mouseenter and
 * cleared on mouseleave — never while the card is at rest.
 */
export function useHeadlineRotation(
  winners: HeadlineWinner[],
  options: { reducedMotion?: boolean } = {},
): HeadlineRotation {
  const reducedMotion = options.reducedMotion ?? prefersReducedMotion();
  const [hovering, setHovering] = useState(false);
  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const winnersRef = useRef(winners);
  winnersRef.current = winners;

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const onMouseLeave = useCallback(() => {
    clearTimer();
    setHovering(false);
    setIndex(0);
  }, [clearTimer]);

  const onMouseEnter = useCallback(() => {
    if (reducedMotion) return;
    clearTimer();
    setHovering(true);
    setIndex(0);
    if (winnersRef.current.length > 1) {
      timerRef.current = setInterval(() => {
        const count = winnersRef.current.length;
        setIndex((current) => (count === 0 ? 0 : (current + 1) % count));
      }, HEADLINE_ROTATION_MS);
    }
  }, [clearTimer, reducedMotion]);

  useEffect(() => clearTimer, [clearTimer]);

  return {
    hovering,
    reducedMotion,
    index,
    current: hovering ? winners[index] : undefined,
    onMouseEnter,
    onMouseLeave,
    start: onMouseEnter,
    stop: onMouseLeave,
  };
}
