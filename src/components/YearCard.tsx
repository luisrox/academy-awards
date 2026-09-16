"use client";

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

/**
 * Resting year tile; on hover, rotates headline winners. The interval lives
 * only while the pointer is over this card (spec.md 6.2).
 */
export function YearCard({ entry }: YearCardProps) {
  const rotation = useHeadlineRotation(entry.headline);

  return (
    <Link
      href={`/${entry.slug}`}
      scroll={false}
      className="block no-underline"
      aria-label={`${entry.label}, ${entry.subtitle}`}
      onMouseEnter={rotation.onMouseEnter}
      onMouseLeave={rotation.onMouseLeave}
    >
      <DecoFrame className="flex min-h-[8.5rem] flex-col justify-center bg-surface px-5 py-6">
        <p className="font-display text-4xl font-semibold tracking-tight text-gold sm:text-5xl">
          {entry.label}
        </p>
        {!rotation.hovering && !rotation.reducedMotion ? (
          <p className="mt-2 font-sans text-xs tracking-wide text-muted">
            {entry.subtitle}
          </p>
        ) : null}
        {rotation.reducedMotion ? (
          <ul className="mt-3 flex flex-col gap-2">
            {entry.headline.map((winner) => (
              <li key={winner.category}>
                <WinnerLines winner={winner} />
              </li>
            ))}
          </ul>
        ) : null}
        <AnimatePresence mode="wait">
          {rotation.current ? (
            <motion.div
              key={rotation.current.category}
              className="mt-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28 }}
            >
              <WinnerLines winner={rotation.current} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </DecoFrame>
    </Link>
  );
}
