"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { DecoFrame } from "@/components/deco/DecoFrame";
import { useHeadlineRotation } from "@/hooks/useHeadlineRotation";
import type { GridEntry, HeadlineWinner } from "@/lib/types";

type YearCardProps = {
  entry: GridEntry;
};

function WinnerLines({ winner }: { winner: HeadlineWinner }) {
  return (
    <>
      <p className="font-sans text-[0.65rem] tracking-[0.2em] text-muted uppercase">
        {winner.category}
      </p>
      <p className="font-display text-lg leading-tight text-gold-light sm:text-xl">
        {winner.winner}
      </p>
      {winner.movie && winner.movie !== winner.winner ? (
        <p className="font-sans text-xs text-muted">{winner.movie}</p>
      ) : null}
    </>
  );
}

function canHover(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(hover: hover)").matches
  );
}

/**
 * Resting year tile. On hover-capable pointers, rotates headline winners
 * while the pointer is over the card. On touch, visible cards rotate via
 * IntersectionObserver — only in-view cards mount a timer (spec.md 6.2 / 7.3).
 */
export function YearCard({ entry }: YearCardProps) {
  const rotation = useHeadlineRotation(entry.headline);
  const { start, stop, reducedMotion } = rotation;
  const rootRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (reducedMotion || canHover()) return;
    if (typeof IntersectionObserver === "undefined") return;
    const node = rootRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) start();
        else stop();
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      stop();
    };
  }, [reducedMotion, start, stop]);

  return (
    <Link
      ref={rootRef}
      id={`year-card-${entry.slug}`}
      href={`/${entry.slug}`}
      scroll={false}
      className="block no-underline"
      onMouseEnter={rotation.onMouseEnter}
      onMouseLeave={rotation.onMouseLeave}
    >
      <DecoFrame className="flex min-h-[11.5rem] flex-col justify-center bg-surface px-5 py-6">
        <p className="font-display text-4xl font-semibold tracking-tight text-gold sm:text-5xl">
          {entry.label}
        </p>
        {rotation.reducedMotion ? (
          <ul className="mt-3 flex flex-col gap-2">
            {entry.headline.map((winner) => (
              <li key={winner.category}>
                <WinnerLines winner={winner} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3 min-h-[4.75rem]">
            {!rotation.hovering ? (
              <p className="font-sans text-xs tracking-wide text-muted">
                {entry.subtitle}
              </p>
            ) : null}
            <AnimatePresence mode="wait">
              {rotation.current ? (
                <motion.div
                  key={rotation.current.category}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.28 }}
                >
                  <WinnerLines winner={rotation.current} />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </DecoFrame>
    </Link>
  );
}
