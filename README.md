# Oscars Winners

A static site of every Academy Awards ceremony: one grid, one overlay per edition, no accounts. Generated ceremony data lives in `data/` and is committed. `npm run build` runs `data:check` then `next build`, so a production build never hits the network.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Ceremony pages live at `/{slug}` — `/2026`, `/1930-2nd`, and so on. Those slugs are a public contract and **must not change** after they are published.

Regenerate artifacts with `npm run data:build` when the sources change. Download missing posters and portraits with `npm run images` (needs `TMDB_API_KEY` in `.env.local`; the site runtime never reads it).

## Annual update (99th ceremony and after)

Run this by hand after each ceremony. The data cannot absorb a silent error, so every step is reviewed.

**Before anything else**, add the new ceremony date to `CEREMONY_DATES` in `src/data/ceremonies.ts`. That is the only field written by hand each year.

```bash
npm run sync:oscars -- 99    # fetch the 99th from the official database
git diff data/raw/           # review the raw scrape
npm run data:build           # regenerate artifacts
npm run test                 # data integrity
npm run images               # poster and portraits for the new winners
git diff data/               # review the final artifacts
```

`sync:oscars` writes only `data/raw/official-{ordinal}.json`. If that file already exists it prints a readable diff (nominations, categories, winner changes) and refuses to overwrite until you pass `--yes`. `normalize.ts` is the only script that produces `data/index.json`, `data/search.json`, and the ceremony details.

If the ceremony introduces a new category, the build **fails on purpose** with the exact unmapped name. That is the signal to add it to the dictionary in `src/data/categories.ts` with its group and sort order, then run `npm run data:build` again.

### Posters and portraits for new winners

`npm run images` searches TMDB for directing and acting winners and keeps an id only when that person appears in the winning film's credits. Results go to `data/people.json`. A name already listed there — including `tmdbId: null` — is never re-resolved.

Editions that come from the official database (97th onward) have **no `tmdb_id`** on films, because the Academy HTML lists titles only. There is no poster to download and no credit list to check a person against until the title itself is resolved, so `npm run images` looks up the Best Picture winner and the directing and acting winners' films first and writes them to `data/films.json`. A title is accepted only when the name matches exactly (ignoring case, accents and punctuation) and the release year is the film year or the one after it.

`data/people.json` and `data/films.json` are the only data files that may be edited by hand; `normalize.ts` reads them instead of regenerating them. When more than one candidate survives, the script writes nothing and prints each candidate with its release date and vote count so the row can be settled by hand — that is how `The Brutalist` is pinned in `films.json`. When the sources spell one person two ways, keep both rows and point the variant at the canonical name with `aliasOf`.

`data:check` warns when a Best Picture winner still has no TMDB id, since that one gap silently costs the whole edition its images.

## Checks

```bash
npm test          # unit, component, and data integrity (D1–D21)
npm run test:e2e  # journeys, axe, Lighthouse, CLS
npm run data:check
```

CI runs the same checks, including the 4 MB `public/images/` budget. Do not raise those thresholds to make a visual effect pass.
