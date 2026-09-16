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
      <ul className="flex gap-1 overflow-x-auto px-6 py-3">
        {decades.map((decade) => (
          <li key={decade} className="shrink-0">
            <a
              href={`#${decadeSectionId(decade)}`}
              className="px-2 py-1 font-sans text-sm tracking-wide text-gold hover:text-gold-light"
            >
              {decade}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
