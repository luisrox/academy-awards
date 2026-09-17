"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type TouchEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DecoFrame } from "@/components/deco/DecoFrame";
import { Emblem } from "@/components/deco/Emblem";
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

const SWIPE_MIN_PX = 48;

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
      className="flex items-start gap-2 font-display text-xl leading-tight text-gold-light md:text-2xl"
    >
      <Emblem size={12} className="mt-1.5 shrink-0 text-gold" />
      <div>
        {names ? <p>{names}</p> : null}
        {movies.map((title) => (
          <p key={title} className="mt-0.5 font-display">
            {title}
          </p>
        ))}
      </div>
    </div>
  );
}

function NomineeEntry({ entry }: { entry: Entry }) {
  const names = formatNames(entry.names);
  const movies = movieTitles(entry);
  const line = [names, ...movies].filter(Boolean).join(" — ");
  return (
    <div
      data-entry-role="nominee"
      className="font-sans text-[0.8125rem] leading-snug text-muted"
    >
      <p>{line}</p>
    </div>
  );
}

function CategoryBlock({ category }: { category: CeremonyCategory }) {
  return (
    <section
      data-category-block
      className="mb-0 break-inside-avoid"
      aria-labelledby={`category-${category.id}`}
    >
      <h3
        id={`category-${category.id}`}
        className="font-sans text-[0.65rem] tracking-[0.25em] text-gold uppercase"
      >
        {category.label}
      </h3>
      <ul className="mt-2 flex flex-col gap-2">
        {category.winners.map((entry, index) => (
          <li key={`winner-${index}`}>
            <WinnerEntry entry={entry} />
          </li>
        ))}
      </ul>
      {category.nominees.length > 0 ? (
        <div className="mt-3">
          <h4 className="font-sans text-[0.65rem] tracking-[0.2em] text-muted uppercase">
            Nominees
          </h4>
          <ul className="mt-1.5 flex flex-col gap-1">
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

function GroupLinks({
  groups,
  className = "",
}: {
  groups: CeremonyDetailData["groups"];
  className?: string;
}) {
  return (
    <ul className={`flex flex-col gap-2 ${className}`.trim()}>
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
  );
}

function Chevron({ direction }: { direction: "previous" | "next" }) {
  const isNext = direction === "next";
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
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
  const sideClass =
    direction === "previous"
      ? "left-3 top-4 md:top-1/2 md:-translate-y-1/2"
      : "right-3 top-4 md:top-1/2 md:-translate-y-1/2";

  return (
    <button
      type="button"
      data-edition-arrow={direction}
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        if (slug) onNavigate(slug);
      }}
      className={`absolute z-50 flex h-10 w-10 items-center justify-center rounded-pill border border-gold bg-ink/55 text-gold backdrop-blur-sm hover:text-gold-light disabled:cursor-not-allowed disabled:opacity-40 ${sideClass}`}
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
  const swipeOrigin = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    const touch = event.changedTouches[0];
    if (!touch) return;
    swipeOrigin.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const origin = swipeOrigin.current;
      swipeOrigin.current = null;
      const touch = event.changedTouches[0];
      if (!origin || !touch) return;
      const dx = touch.clientX - origin.x;
      const dy = touch.clientY - origin.y;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) <= Math.abs(dy)) return;
      if (dx < 0 && next) goTo(next.slug);
      if (dx > 0 && previous) goTo(previous.slug);
    },
    [goTo, next, previous],
  );

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
      className="fixed inset-0 z-40 flex justify-center bg-ink md:bg-ink/80 md:p-8"
    >
      <div ref={contentRef} className="contents">
        <EditionArrow
          direction="previous"
          slug={previous?.slug}
          onNavigate={goTo}
        />
        <DecoFrame
          data-overlay-panel
          radius="panel"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          className="flex h-full max-h-full w-full max-w-none gap-8 overflow-y-auto px-6 pb-6 pt-14 md:max-w-6xl md:px-8 md:pb-8 md:pt-6"
        >
          {children}
        </DecoFrame>
        <EditionArrow direction="next" slug={next?.slug} onNavigate={goTo} />
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
        <GroupLinks groups={groups} />
      </nav>
      <div className="min-w-0 flex-1">
        <details className="deco-frame deco-frame-flat mb-4 px-4 py-2 lg:hidden">
          <summary className="cursor-pointer font-sans text-sm tracking-wide text-gold">
            Category groups
          </summary>
          <GroupLinks groups={groups} className="mt-3" />
        </details>
        <header className="mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 font-sans text-xs tracking-[0.25em] text-gold uppercase">
              <Emblem size={16} />
              {ordinalSuffix(ceremony.ordinal)} Ceremony
            </p>
            <h1
              id="ceremony-heading"
              className="mt-1 font-display text-4xl tracking-tight text-gold md:text-5xl"
            >
              {ceremony.ceremonyYear}
            </h1>
            <p className="mt-2 font-sans text-sm text-muted">
              Films of {ceremony.filmYearLabel}
              <span aria-hidden="true"> · </span>
              <time dateTime={ceremony.ceremonyDate}>
                {ceremonyDateLabel(ceremony)}
              </time>
            </p>
            <AmbiguousYearNotice slug={ceremony.slug} />
          </div>
          <DecoFrame
            variant="flat"
            data-poster-slot
            aria-hidden="true"
            className="aspect-[2/3] w-24 shrink-0 md:w-28"
          />
        </header>
        {groups.map((group) => (
          <section
            key={group.id}
            id={`group-${group.id}`}
            className="scroll-mt-6 border-t border-gold/20 py-4"
            aria-labelledby={`group-label-${group.id}`}
          >
            <h2
              id={`group-label-${group.id}`}
              className="mb-2 font-display text-xs tracking-[0.3em] text-gold uppercase"
            >
              {group.label}
            </h2>
            <div
              data-category-flow
              className="grid gap-y-4 lg:grid-cols-2 lg:gap-x-10"
            >
              {group.categories.map((category) => (
                <CategoryBlock key={category.id} category={category} />
              ))}
            </div>
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
