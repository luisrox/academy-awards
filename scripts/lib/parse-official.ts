import { load, type Cheerio } from "cheerio";
import type { AnyNode } from "domhandler";
import {
  parseFilmYear,
  resolveCategoryId,
  resolveCategoryLabel,
} from "@/data/categories";
import { ceremonyByOrdinal } from "@/data/ceremonies";
import type { Movie } from "@/lib/types";
import type { NominationRecord } from "./load-historical";

/**
 * CSS class that marks a winner in the official results HTML.
 * Isolated here on purpose: this is the most brittle part of the scraper.
 */
export const WINNER_ICON_SELECTOR = ".glyphicon-star";

const CATEGORY_TITLE_SELECTOR = ".result-subgroup-title a.nominations-link";
const CATEGORY_BLOCK_SELECTOR = ".result-subgroup.subgroup-awardcategory-chron";
const NOMINATION_ROW_SELECTOR = ".result-details";

const NON_COMPETITIVE =
  /^(JEAN HERSHOLT|HONORARY AWARD|IRVING G\. THALBERG|SCIENTIFIC AND TECHNICAL|SPECIAL ACHIEVEMENT|GORDON E\. SAWYER|AWARD OF COMMENDATION)/i;

/** Categories where the work, not a person, is what the UI treats as the winner. */
const FILM_AS_NAME = new Set([
  "best-picture",
  "best-animated-feature",
  "best-international-feature",
  "best-documentary-feature",
  "best-animated-short",
  "best-live-action-short",
  "best-live-action-short-two-reel",
  "best-live-action-short-color",
  "best-documentary-short",
]);

function clean(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function peopleFrom(statement: string): string[] {
  let text = statement.replace(/^(Music and Lyric by|Music by|Lyric by)\s+/i, "");
  text = text.replace(/;?\s*Lyric by\s+.+$/i, "");
  text = text.replace(/,?\s*Producers?$/i, "");
  if (!text) return [];
  return text
    .split(/\s*,\s*|\s+&\s+|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

function unquote(text: string): string {
  return text.replace(/^["“«']+|["”»']+$/g, "").trim();
}

function nominationFields(
  row: Cheerio<AnyNode>,
): { statement: string; film: string; song: string } {
  const statement = clean(row.find(".awards-result-nominationstatement").text());
  const film = clean(row.find(".awards-result-film-title").first().text());
  const song = unquote(clean(row.find(".awards-result-songtitle").text()));
  return { statement, film, song };
}

/**
 * Parse one official-results HTML page into canonical nomination rows.
 * Pure: no network or disk. Honorary/scientific blocks are skipped.
 */
export function parseOfficialResults(
  html: string,
  ordinal: number,
): NominationRecord[] {
  const ceremony = ceremonyByOrdinal(ordinal);
  if (!ceremony) {
    throw new Error(`No ceremony for ordinal ${ordinal}`);
  }
  const filmYear = parseFilmYear(ceremony.filmYearLabel);
  const $ = load(html);
  const blocks = $(CATEGORY_BLOCK_SELECTOR);
  const titles = blocks.find(CATEGORY_TITLE_SELECTOR);

  if (titles.length === 0) {
    throw new Error(
      "Official results HTML has no award categories; the parser needs to be updated",
    );
  }

  const records: NominationRecord[] = [];
  const unmapped: string[] = [];
  let competitiveCategories = 0;
  let winners = 0;

  blocks.each((_, block) => {
    const rawName = clean($(block).find(CATEGORY_TITLE_SELECTOR).first().text());
    if (!rawName || NON_COMPETITIVE.test(rawName)) return;

    const definition = resolveCategoryId(rawName);
    if (!definition) {
      unmapped.push(rawName);
      return;
    }
    competitiveCategories += 1;
    const acting = definition.group === "acting";
    const categoryLabel = resolveCategoryLabel(definition.id, filmYear);

    $(block)
      .find(NOMINATION_ROW_SELECTOR)
      .each((__, rowEl) => {
        const row = $(rowEl);
        const won = row.find(WINNER_ICON_SELECTOR).length > 0;
        if (won) winners += 1;

        const { statement, film, song } = nominationFields(row);
        const movies: Movie[] = film ? [{ title: film }] : [];
        let names: string[];
        if (song) {
          names = [song];
        } else if (acting) {
          names = statement ? [statement] : [];
        } else if (FILM_AS_NAME.has(definition.id) && film) {
          names = [film];
        } else {
          names = statement ? peopleFrom(statement) : film ? [film] : [];
        }

        records.push({
          ordinal,
          categoryId: definition.id,
          categoryLabel,
          names,
          movies,
          won,
        });
      });
  });

  if (unmapped.length > 0) {
    throw new Error(
      `Unmapped category names: ${[...new Set(unmapped)].join("; ")}`,
    );
  }
  if (competitiveCategories === 0) {
    throw new Error(
      "Official results HTML has no award categories; the parser needs to be updated",
    );
  }
  if (winners === 0) {
    throw new Error(
      `No winners detected; the winner icon CSS class probably changed (${WINNER_ICON_SELECTOR})`,
    );
  }

  return records;
}
