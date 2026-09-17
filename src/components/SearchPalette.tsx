"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOverlay } from "@/hooks/useOverlay";
import { fetchSearchIndex } from "@/lib/load-search-index";
import { filterSearchDocs, groupSearchDocs } from "@/lib/search";
import type { SearchDoc } from "@/lib/types";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}

export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  const { overlayRef, contentRef } = useOverlay({
    isOpen: open,
    onClose: close,
    returnFocus: () => buttonRef.current,
    initialFocus: () => inputRef.current,
  });

  const loadIndex = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const index = await fetchSearchIndex();
      setDocs(index);
    } catch {
      setError("The search index failed to load.");
      setDocs(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    if (docs !== null) return;
    void loadIndex();
  }, [open, docs, loadIndex]);

  const groups = useMemo(
    () => groupSearchDocs(filterSearchDocs(docs ?? [], query)),
    [docs, query],
  );
  const flat = useMemo(
    () => groups.flatMap((group) => group.docs),
    [groups],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, docs]);

  const openResult = useCallback(
    (doc: SearchDoc) => {
      close();
      router.push(`/${doc.slug}`, { scroll: false });
    },
    [close, router],
  );

  useEffect(() => {
    function onSlash(event: KeyboardEvent) {
      if (event.key !== "/") return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      setOpen(true);
    }
    document.addEventListener("keydown", onSlash);
    return () => document.removeEventListener("keydown", onSlash);
  }, []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setActiveIndex((index) =>
          flat.length === 0 ? 0 : Math.min(index + 1, flat.length - 1),
        );
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        event.stopImmediatePropagation();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }
      if (event.key !== "Enter") return;
      if (event.target instanceof HTMLElement && event.target.closest("a[href]")) {
        return;
      }
      const doc = flat[activeIndex];
      if (!doc) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openResult(doc);
    }

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, flat, activeIndex, openResult]);

  const activeId =
    flat.length > 0 ? `search-option-${activeIndex}` : undefined;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Open search"
        aria-keyshortcuts="/"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="inline-flex h-9 w-9 items-center justify-center text-gold hover:text-gold-light"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M16.5 16.5 21 21" />
        </svg>
      </button>
      {open ? (
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="search-heading"
          tabIndex={-1}
          className="fixed inset-0 z-[60] flex items-start justify-center bg-ink/80 px-4 pt-[12vh]"
        >
          <div
            ref={contentRef}
            className="deco-frame w-full max-w-xl bg-surface px-6 py-6"
          >
            <h2
              id="search-heading"
              className="font-sans text-xs tracking-[0.25em] text-gold uppercase"
            >
              Search
            </h2>
            <input
              ref={inputRef}
              id="search-field"
              type="search"
              role="combobox"
              aria-label="Search years, films, and people"
              aria-expanded={true}
              aria-controls="search-results"
              aria-autocomplete="list"
              aria-activedescendant={activeId}
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Year, film, or person"
              className="mt-4 w-full border-b border-gold/40 bg-transparent py-3 font-display text-2xl text-gold-light placeholder:text-muted/70"
            />
            {loading ? (
              <p className="mt-4 font-sans text-sm text-muted">
                Loading the search index…
              </p>
            ) : null}
            {error ? (
              <div role="alert" className="mt-4 font-sans text-sm text-muted">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void loadIndex()}
                  className="mt-3 border border-gold/50 px-3 py-1.5 text-gold hover:text-gold-light"
                >
                  Retry
                </button>
              </div>
            ) : null}
            {!loading && !error && docs && query.trim().length === 0 ? (
              <p className="mt-4 font-sans text-sm text-muted">
                Type a year, film, or person.
              </p>
            ) : null}
            {!loading && !error && query.trim().length > 0 && groups.length === 0 ? (
              <p className="mt-4 font-sans text-sm text-muted">No matches.</p>
            ) : null}
            <div id="search-results" role="listbox" className="mt-4 max-h-[50vh] overflow-y-auto">
              {groups.map((group) => (
                <section
                  key={group.kind}
                  role="group"
                  aria-label={group.label}
                  className="mb-5"
                >
                  <h3 className="font-sans text-xs tracking-[0.25em] text-gold uppercase">
                    {group.label}
                  </h3>
                  <ul className="mt-2">
                    {group.docs.map((doc) => {
                      const index = flat.indexOf(doc);
                      const selected = index === activeIndex;
                      return (
                        <li key={`${doc.kind}:${doc.slug}:${doc.title}`}>
                          <Link
                            id={`search-option-${index}`}
                            href={`/${doc.slug}`}
                            scroll={false}
                            role="option"
                            aria-selected={selected}
                            onClick={close}
                            className={`block px-2 py-2 ${
                              selected ? "bg-gold/15" : "hover:bg-gold/10"
                            }`}
                          >
                            <span className="font-display text-lg text-gold-light">
                              {doc.title}
                            </span>
                            <span className="ml-3 font-sans text-sm text-muted">
                              {doc.detail}
                            </span>
                            {doc.kind !== "year" ? (
                              <span className="ml-3 font-sans text-xs tracking-wide text-gold uppercase">
                                {doc.won ? "Winner" : "Nominee"}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}