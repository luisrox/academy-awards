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

### Portraits for new winners

`npm run images` searches TMDB for directing and acting winners and keeps an id only when that person appears in the winning film's credits. Results go to `data/people.json`, which is the only data file that may be edited by hand. A name already listed there — including `tmdbId: null` — is never re-resolved.

Editions that come from the official database (97th onward) have **no `tmdb_id`** on films. Without a film id the script cannot disambiguate a person, so those portraits will not download on their own. Fill `data/people.json` by hand (name, TMDB person id, film used as proof), then re-run `npm run images` to fetch the files. If several credited candidates share the name, the script prints them and leaves the row for you.

## Checks

```bash
npm test          # unit, component, and data integrity (D1–D19)
npm run test:e2e  # journeys, axe, Lighthouse, CLS
npm run data:check
```

CI runs the same checks, including the 4 MB `public/images/` budget. Do not raise those thresholds to make a visual effect pass.
