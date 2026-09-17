import { decadeBuckets } from "@/data/ceremonies";

export function decadeSectionId(decade: string): string {
  return `decade-${decade}`;
}

type DecadeNavProps = {
  decades?: string[];
};

export function DecadeNav({
  decades = decadeBuckets().map((bucket) => bucket.decade),
}: DecadeNavProps) {
  return (
    <nav
      aria-label="Decades"
      className="sticky top-0 z-20 border-b border-gold/25 bg-ink"
    >
      <ul className="flex gap-2 overflow-x-auto px-6 py-3 md:gap-1">
        {decades.map((decade) => (
          <li key={decade} className="shrink-0">
            <a
              href={`#${decadeSectionId(decade)}`}
              className="inline-block rounded-pill border border-gold/50 px-3 py-1.5 font-sans text-sm tracking-wide text-gold hover:text-gold-light md:border-transparent md:px-2 md:py-1"
            >
              {decade}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
