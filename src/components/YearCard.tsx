import Link from "next/link";
import { DecoFrame } from "@/components/deco/DecoFrame";
import type { GridEntry } from "@/lib/types";

type YearCardProps = {
  entry: GridEntry;
};

/**
 * Resting year tile. Hover rotation is added in step 18; this file must
 * not mount timers.
 */
export function YearCard({ entry }: YearCardProps) {
  return (
    <Link
      href={`/${entry.slug}`}
      scroll={false}
      className="block no-underline"
      aria-label={`${entry.label}, ${entry.subtitle}`}
    >
      <DecoFrame className="bg-surface px-5 py-6">
        <p className="font-display text-4xl font-semibold tracking-tight text-gold sm:text-5xl">
          {entry.label}
        </p>
        <p className="mt-2 font-sans text-xs tracking-wide text-muted">
          {entry.subtitle}
        </p>
      </DecoFrame>
    </Link>
  );
}
