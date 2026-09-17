import { decadeBuckets } from "@/data/ceremonies";
import { YearCard } from "@/components/YearCard";
import { RayDivider } from "@/components/deco/RayDivider";
import { decadeSectionId } from "@/components/DecadeNav";
import type { GridEntry } from "@/lib/types";

type YearGridProps = {
  entries: GridEntry[];
};

function groupByDecade(entries: GridEntry[]) {
  const bySlug = new Map(entries.map((entry) => [entry.slug, entry]));
  return decadeBuckets().map(({ decade, ceremonies }) => ({
    decade,
    entries: ceremonies.map((ceremony) => {
      const entry = bySlug.get(ceremony.slug);
      if (!entry) {
        throw new Error(`Missing grid entry for slug ${ceremony.slug}`);
      }
      return entry;
    }),
  }));
}

export function YearGrid({ entries }: YearGridProps) {
  const buckets = groupByDecade(entries);
  return (
    <div className="px-6 pb-16">
      {buckets.map(({ decade, entries: decadeEntries }) => (
        <section
          key={decade}
          id={decadeSectionId(decade)}
          aria-labelledby={`${decadeSectionId(decade)}-label`}
          className="scroll-mt-16"
        >
          <header className="stage-sticky sticky top-12 z-10 py-5">
            <h2
              id={`${decadeSectionId(decade)}-label`}
              className="font-display text-sm tracking-[0.3em] text-gold"
            >
              {decade}
            </h2>
            <RayDivider className="mt-3" />
          </header>
          <ul className="grid grid-cols-2 gap-4 pt-2 md:grid-cols-4 lg:grid-cols-6">
            {decadeEntries.map((entry) => (
              <li key={entry.slug}>
                <YearCard entry={entry} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
