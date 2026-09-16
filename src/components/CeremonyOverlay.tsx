import { ceremonyDateLabel, ordinalSuffix } from "@/data/ceremonies";
import type {
  CeremonyCategory,
  CeremonyDetail,
  Entry,
} from "@/lib/types";

type CeremonyOverlayProps = {
  detail: CeremonyDetail;
};

function formatNames(names: string[]): string {
  return names.join(", ");
}

function movieTitles(entry: Entry): string[] {
  return entry.movies
    .map((movie) => movie.title)
    .filter((title) => !entry.names.includes(title));
}

function WinnerEntry({ entry }: { entry: Entry }) {
  const names = formatNames(entry.names);
  const movies = movieTitles(entry);
  return (
    <div
      data-entry-role="winner"
      className="font-display text-3xl leading-tight text-gold-light"
    >
      {names ? <p>{names}</p> : null}
      {movies.map((title) => (
        <p key={title} className="mt-1 font-display text-xl text-gold-light">
          {title}
        </p>
      ))}
    </div>
  );
}

function NomineeEntry({ entry }: { entry: Entry }) {
  const names = formatNames(entry.names);
  const movies = movieTitles(entry);
  return (
    <div data-entry-role="nominee" className="font-sans text-sm text-muted">
      {names ? <p>{names}</p> : null}
      {movies.map((title) => (
        <p key={title} className="text-xs text-muted">
          {title}
        </p>
      ))}
    </div>
  );
}

function CategoryBlock({ category }: { category: CeremonyCategory }) {
  return (
    <section className="mt-8" aria-labelledby={`category-${category.id}`}>
      <h3
        id={`category-${category.id}`}
        className="font-sans text-xs tracking-[0.25em] text-gold uppercase"
      >
        {category.label}
      </h3>
      <ul className="mt-3 flex flex-col gap-4">
        {category.winners.map((entry, index) => (
          <li key={`winner-${index}`}>
            <WinnerEntry entry={entry} />
          </li>
        ))}
      </ul>
      {category.nominees.length > 0 ? (
        <div className="mt-5">
          <h4 className="font-sans text-[0.65rem] tracking-[0.2em] text-muted uppercase">
            Nominees
          </h4>
          <ul className="mt-2 flex flex-col gap-2">
            {category.nominees.map((entry, index) => (
              <li key={`nominee-${index}`}>
                <NomineeEntry entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/**
 * Full ceremony detail. Renders as an overlay on the year grid; focus trap
 * and Esc handling arrive in the next step.
 */
export function CeremonyOverlay({ detail }: CeremonyOverlayProps) {
  const { ceremony, groups } = detail;

  return (
    <article
      className="absolute inset-0 z-30 overflow-y-auto bg-surface"
      aria-labelledby="ceremony-heading"
    >
      <div className="mx-auto flex max-w-6xl gap-10 px-6 py-10">
        <nav
          aria-label="Category groups"
          className="sticky top-4 hidden h-fit w-44 shrink-0 lg:block"
        >
          <ul className="flex flex-col gap-2">
            {groups.map((group) => (
              <li key={group.id}>
                <a
                  href={`#group-${group.id}`}
                  className="font-sans text-sm tracking-wide text-gold hover:text-gold-light"
                >
                  {group.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 flex-1">
          <header className="mb-12 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="font-sans text-sm tracking-[0.25em] text-gold uppercase">
                {ordinalSuffix(ceremony.ordinal)} Ceremony
              </p>
              <h1
                id="ceremony-heading"
                className="mt-2 font-display text-6xl tracking-tight text-gold md:text-8xl"
              >
                {ceremony.ceremonyYear}
              </h1>
              <p className="mt-3 font-sans text-muted">
                Films of {ceremony.filmYearLabel}
              </p>
              <time
                dateTime={ceremony.ceremonyDate}
                className="mt-1 block font-sans text-muted"
              >
                {ceremonyDateLabel(ceremony)}
              </time>
            </div>
            <div
              data-poster-slot
              aria-hidden="true"
              className="deco-frame aspect-[2/3] w-36 shrink-0 bg-ink"
            />
          </header>
          {groups.map((group) => (
            <section
              key={group.id}
              id={`group-${group.id}`}
              className="scroll-mt-8 border-t border-gold/20 py-10"
              aria-labelledby={`group-label-${group.id}`}
            >
              <h2
                id={`group-label-${group.id}`}
                className="font-display text-sm tracking-[0.3em] text-gold uppercase"
              >
                {group.label}
              </h2>
              {group.categories.map((category) => (
                <CategoryBlock key={category.id} category={category} />
              ))}
            </section>
          ))}
        </div>
      </div>
    </article>
  );
}
