"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  adjacentCeremonies,
  ceremonyDateLabel,
  ordinalSuffix,
  siblingCeremonies,
} from "@/data/ceremonies";
import { useOverlay } from "@/hooks/useOverlay";
import type {
  CeremonyCategory,
  CeremonyDetail as CeremonyDetailData,
  Entry,
} from "@/lib/types";

type CeremonyOverlayProps = {
  detail: CeremonyDetailData;
};

type CeremonyChromeProps = {
  slug: string;
  children: ReactNode;
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

function Chevron({ direction }: { direction: "previous" | "next" }) {
  const isNext = direction === "next";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      {isNext ? (
        <path d="M9 5l7 7-7 7" />
      ) : (
        <path d="M15 5l-7 7 7 7" />
      )}
    </svg>
  );
}

function AmbiguousYearNotice({ slug }: { slug: string }) {
  const siblings = siblingCeremonies(slug);
  if (siblings.length === 0) return null;

  return (
    <p
      role="status"
      className="mt-4 max-w-md font-sans text-sm leading-relaxed text-muted"
    >
      {siblings[0].ceremonyYear} hosted {siblings.length + 1} ceremonies.{" "}
      {siblings.map((sibling) => (
        <Link
          key={sibling.slug}
          href={`/${sibling.slug}`}
          scroll={false}
          className="text-gold hover:text-gold-light"
        >
          See the {ordinalSuffix(sibling.ordinal)} Ceremony ({ceremonyDateLabel(sibling)})
        </Link>
      ))}
    </p>
  );
}

function EditionArrow({
  direction,
  slug,
  onNavigate,
}: {
  direction: "previous" | "next";
  slug: string | undefined;
  onNavigate: (slug: string) => void;
}) {
  const disabled = !slug;
  const label = direction === "previous" ? "Previous ceremony" : "Next ceremony";
  const sideClass = direction === "previous" ? "left-3 md:left-6" : "right-3 md:right-6";

  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (slug) onNavigate(slug);
      }}
      className={`fixed top-1/2 z-50 -translate-y-1/2 deco-frame bg-surface p-3 text-gold hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-40 ${sideClass}`}
    >
      <Chevron direction={direction} />
    </button>
  );
}

/**
 * Persistent overlay chrome. Lives in the [slug] layout so prev/next
 * navigation does not remount the dialog or drop the focus trap.
 */
export function CeremonyChrome({ slug, children }: CeremonyChromeProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const { previous, next } = adjacentCeremonies(slug);
  const onClose = useCallback(() => {
    setOpen(false);
    router.push("/", { scroll: false });
  }, [router]);
  const goTo = useCallback(
    (target: string) => {
      router.push(`/${target}`, { scroll: false });
    },
    [router],
  );
  const { overlayRef, contentRef } = useOverlay({
    isOpen: open,
    onClose,
    returnFocus: `#year-card-${slug}`,
  });

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (previous) goTo(previous.slug);
        return;
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (next) goTo(next.slug);
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, previous, next, goTo]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ceremony-heading"
      tabIndex={-1}
      className="fixed inset-0 z-40 flex justify-center bg-ink/80 md:p-8"
    >
      <div
        ref={contentRef}
        className="flex h-full max-h-full w-full max-w-6xl gap-10 overflow-y-auto bg-surface px-6 py-10"
      >
        <EditionArrow
          direction="previous"
          slug={previous?.slug}
          onNavigate={goTo}
        />
        <EditionArrow direction="next" slug={next?.slug} onNavigate={goTo} />
        {children}
      </div>
    </div>
  );
}

/** Ceremony body: header, group index, and categories. */
export function CeremonyDetail({ detail }: { detail: CeremonyDetailData }) {
  const { ceremony, groups } = detail;

  return (
    <>
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
            <AmbiguousYearNotice slug={ceremony.slug} />
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
    </>
  );
}

/**
 * Full ceremony detail as an accessible modal over the year grid.
 * The route itself stays a prerendered page; this shell handles Esc,
 * click-outside, focus, and scroll lock (spec.md 7.2).
 */
export function CeremonyOverlay({ detail }: CeremonyOverlayProps) {
  return (
    <CeremonyChrome slug={detail.ceremony.slug}>
      <CeremonyDetail detail={detail} />
    </CeremonyChrome>
  );
}
