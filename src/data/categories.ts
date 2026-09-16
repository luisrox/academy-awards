import type { CategoryGroup } from "@/lib/types";

export type CategoryGroupDefinition = {
  id: CategoryGroup;
  label: string;
};

export const CATEGORY_GROUPS: CategoryGroupDefinition[] = [
  { id: "headline", label: "The Big Two" },
  { id: "acting", label: "Acting" },
  { id: "writing", label: "Writing" },
  { id: "feature", label: "Features" },
  { id: "craft", label: "Crafts" },
  { id: "music", label: "Music" },
  { id: "shorts", label: "Short Films" },
  { id: "retired", label: "Retired Categories" },
  { id: "special", label: "Special Awards" },
];

const GROUP_ORDER = new Map(
  CATEGORY_GROUPS.map((group, index) => [group.id, index]),
);

export function groupOrder(id: CategoryGroup): number {
  const order = GROUP_ORDER.get(id);
  if (order === undefined) {
    throw new Error(`Unknown category group: ${id}`);
  }
  return order;
}

export type CategoryDefinition = {
  id: string;
  group: CategoryGroup;
  /** Position inside the group; unique together with `group`. */
  order: number;
  /** Raw names from the historical dataset and the official Academy database. */
  aliases: string[];
};

/**
 * Groups reflect the nature of the category, not whether it is extinct.
 * That is why best-cinematography-bw lives in "craft" and not in "retired":
 * in a 1960 view it must sit next to the color counterpart. "retired" is
 * reserved for categories with no modern equivalent at all.
 */
export const CATEGORIES: CategoryDefinition[] = [
  {
    id: "best-picture",
    group: "headline",
    order: 0,
    aliases: [
      "Best Picture",
      "BEST PICTURE",
      "OUTSTANDING PICTURE",
      "OUTSTANDING PRODUCTION",
      "OUTSTANDING MOTION PICTURE",
      "BEST MOTION PICTURE",
    ],
  },
  {
    id: "best-director",
    group: "headline",
    order: 1,
    aliases: ["Best Director", "DIRECTING", "DIRECTOR"],
  },
  {
    id: "best-actor",
    group: "acting",
    order: 0,
    aliases: [
      "Best Actor",
      "ACTOR",
      "ACTOR IN A LEADING ROLE",
      "Actor -- Leading Role",
    ],
  },
  {
    id: "best-actress",
    group: "acting",
    order: 1,
    aliases: [
      "Best Actress",
      "ACTRESS",
      "ACTRESS IN A LEADING ROLE",
      "Actress -- Leading Role",
    ],
  },
  {
    id: "best-supporting-actor",
    group: "acting",
    order: 2,
    aliases: [
      "Best Supporting Actor",
      "ACTOR IN A SUPPORTING ROLE",
      "Actor -- Supporting Role",
    ],
  },
  {
    id: "best-supporting-actress",
    group: "acting",
    order: 3,
    aliases: [
      "Best Supporting Actress",
      "ACTRESS IN A SUPPORTING ROLE",
      "Actress -- Supporting Role",
    ],
  },
  {
    id: "best-original-screenplay",
    group: "writing",
    order: 0,
    aliases: [
      "Best Original Screenplay",
      "WRITING (ORIGINAL SCREENPLAY)",
      "WRITING (SCREENPLAY WRITTEN DIRECTLY FOR THE SCREEN)",
    ],
  },
  {
    id: "best-adapted-screenplay",
    group: "writing",
    order: 1,
    aliases: [
      "Best Adapted Screenplay",
      "WRITING (ADAPTED SCREENPLAY)",
      "WRITING (SCREENPLAY BASED ON MATERIAL FROM ANOTHER MEDIUM)",
      "WRITING (ADAPTATION)",
    ],
  },
  {
    id: "best-original-story",
    group: "writing",
    order: 2,
    aliases: [
      "Best Original Story",
      "WRITING (ORIGINAL STORY)",
      "WRITING (STORY)",
    ],
  },
  {
    id: "best-animated-feature",
    group: "feature",
    order: 0,
    aliases: ["Best Animated Feature", "ANIMATED FEATURE FILM"],
  },
  {
    id: "best-international-feature",
    group: "feature",
    order: 1,
    aliases: [
      "Best International Feature Film",
      "INTERNATIONAL FEATURE FILM",
      "FOREIGN LANGUAGE FILM",
      "BEST FOREIGN LANGUAGE FILM",
    ],
  },
  {
    id: "best-documentary-feature",
    group: "feature",
    order: 2,
    aliases: [
      "Best Documentary Feature",
      "DOCUMENTARY FEATURE FILM",
      "DOCUMENTARY (FEATURE)",
    ],
  },
  {
    id: "best-cinematography",
    group: "craft",
    order: 0,
    aliases: [
      "Best Cinematography (Color)",
      "CINEMATOGRAPHY",
      "CINEMATOGRAPHY (COLOR)",
      "BEST CINEMATOGRAPHY",
    ],
  },
  {
    id: "best-cinematography-bw",
    group: "craft",
    order: 1,
    aliases: [
      "Best Cinematography (Black and White)",
      "CINEMATOGRAPHY (BLACK-AND-WHITE)",
      "CINEMATOGRAPHY (BLACK AND WHITE)",
    ],
  },
  {
    id: "best-film-editing",
    group: "craft",
    order: 2,
    aliases: ["Best Film Editing", "FILM EDITING"],
  },
  {
    id: "best-production-design",
    group: "craft",
    order: 3,
    aliases: [
      "Best Production Design (Color)",
      "PRODUCTION DESIGN",
      "PRODUCTION DESIGN (COLOR)",
      "ART DIRECTION",
      "ART DIRECTION (COLOR)",
      "BEST ART DIRECTION",
      "BEST PRODUCTION DESIGN",
    ],
  },
  {
    id: "best-production-design-bw",
    group: "craft",
    order: 4,
    aliases: [
      "Best Production Design (Black and White)",
      "ART DIRECTION (BLACK-AND-WHITE)",
      "ART DIRECTION (BLACK AND WHITE)",
      "PRODUCTION DESIGN (BLACK-AND-WHITE)",
    ],
  },
  {
    id: "best-costume-design",
    group: "craft",
    order: 5,
    aliases: [
      "Best Costume Design (Color)",
      "COSTUME DESIGN",
      "COSTUME DESIGN (COLOR)",
      "BEST COSTUME DESIGN",
    ],
  },
  {
    id: "best-costume-design-bw",
    group: "craft",
    order: 6,
    aliases: [
      "Best Costume Design (Black and White)",
      "COSTUME DESIGN (BLACK-AND-WHITE)",
      "COSTUME DESIGN (BLACK AND WHITE)",
    ],
  },
  {
    id: "best-makeup-hairstyling",
    group: "craft",
    order: 7,
    aliases: [
      "Best Makeup and Hairstyling",
      "MAKEUP AND HAIRSTYLING",
      "MAKEUP",
      "BEST MAKEUP",
    ],
  },
  {
    id: "best-visual-effects",
    group: "craft",
    order: 8,
    aliases: [
      "Best Visual/Special Effects",
      "VISUAL EFFECTS",
      "SPECIAL EFFECTS",
      "BEST VISUAL EFFECTS",
      "BEST SPECIAL EFFECTS",
      "SPECIAL VISUAL EFFECTS",
    ],
  },
  {
    id: "best-sound",
    group: "craft",
    order: 9,
    aliases: [
      "Best Sound Mixing",
      "SOUND",
      "SOUND MIXING",
      "SOUND RECORDING",
      "BEST SOUND",
      "BEST SOUND RECORDING",
    ],
  },
  {
    id: "best-sound-editing",
    group: "craft",
    order: 10,
    aliases: [
      "Best Sound Editing",
      "SOUND EDITING",
      "SOUND EFFECTS",
      "SOUND EFFECTS EDITING",
      "BEST SOUND EFFECTS",
      "BEST SOUND EFFECTS EDITING",
    ],
  },
  {
    id: "best-casting",
    group: "craft",
    order: 11,
    aliases: ["Casting", "CASTING"],
  },
  {
    id: "best-original-score",
    group: "music",
    order: 0,
    aliases: [
      "Best Score",
      "MUSIC (ORIGINAL SCORE)",
      "Music - Original Score",
      "ORIGINAL SCORE",
      "MUSIC (SCORING)",
      "BEST ORIGINAL SCORE",
    ],
  },
  {
    id: "best-score-musical-adaptation",
    group: "music",
    order: 1,
    aliases: [
      "Best Original Musical/Secondary Score Category",
      "Best Score (Musical or Adaptation)",
      "MUSIC (SCORING OF A MUSICAL PICTURE)",
      "MUSIC (ADAPTATION SCORE)",
    ],
  },
  {
    id: "best-original-song",
    group: "music",
    order: 2,
    aliases: [
      "Best Original Song",
      "MUSIC (ORIGINAL SONG)",
      "ORIGINAL SONG",
      "MUSIC (SONG)",
    ],
  },
  {
    id: "best-animated-short",
    group: "shorts",
    order: 0,
    aliases: [
      "Best Animated Short",
      "SHORT FILM (ANIMATED)",
      "SHORT SUBJECT (CARTOON)",
      "SHORT SUBJECT (ANIMATED)",
      "ANIMATED SHORT FILM",
    ],
  },
  {
    id: "best-live-action-short",
    group: "shorts",
    order: 1,
    aliases: [
      "Best Live Action Short (Comedy or One Reel or Regular)",
      "SHORT FILM (LIVE ACTION)",
      "LIVE ACTION SHORT FILM",
      "SHORT SUBJECT (ONE-REEL)",
      "SHORT SUBJECT (COMEDY)",
      "SHORT SUBJECT (LIVE ACTION)",
    ],
  },
  {
    id: "best-live-action-short-two-reel",
    group: "shorts",
    order: 2,
    aliases: [
      "Best Live Action Short (Two-Reel or Novelty)",
      "SHORT SUBJECT (TWO-REEL)",
      "SHORT SUBJECT (NOVELTY)",
      "Best Live Action Short Film (Two-Reel)",
    ],
  },
  {
    id: "best-live-action-short-color",
    group: "shorts",
    order: 3,
    aliases: [
      "Best Live Action Short (Color)",
      "SHORT SUBJECT (COLOR)",
    ],
  },
  {
    id: "best-documentary-short",
    group: "shorts",
    order: 4,
    aliases: [
      "Best Documentary Short",
      "DOCUMENTARY SHORT FILM",
      "DOCUMENTARY (SHORT SUBJECT)",
    ],
  },
  {
    id: "best-assistant-director",
    group: "retired",
    order: 0,
    aliases: ["Best Assistant Director", "ASSISTANT DIRECTOR"],
  },
  {
    id: "best-dance-direction",
    group: "retired",
    order: 1,
    aliases: ["Best Dance Direction", "DANCE DIRECTION"],
  },
  {
    id: "unique-artistic-production",
    group: "retired",
    order: 2,
    aliases: [
      "Unique and Artistic Production",
      "UNIQUE AND ARTISTIC PICTURE",
      "UNIQUE AND ARTISTIC PRODUCTION",
    ],
  },
];

/**
 * Display names used when a category has no era-specific rule.
 *
 * Two deliberate exceptions, where findability beats historical fidelity:
 * - best-picture is always "Best Picture", never "Outstanding Picture",
 *   "Outstanding Production", or "Best Motion Picture".
 * - Acting categories stay "Best Actor" / "Best Supporting Actress", not the
 *   official "Actor in a Leading Role" wording.
 */
const CATEGORY_BASE_LABELS: Record<string, string> = {
  "best-picture": "Best Picture",
  "best-director": "Best Director",
  "best-actor": "Best Actor",
  "best-actress": "Best Actress",
  "best-supporting-actor": "Best Supporting Actor",
  "best-supporting-actress": "Best Supporting Actress",
  "best-original-screenplay": "Best Original Screenplay",
  "best-adapted-screenplay": "Best Adapted Screenplay",
  "best-original-story": "Best Original Story",
  "best-animated-feature": "Best Animated Feature",
  "best-international-feature": "Best International Feature Film",
  "best-documentary-feature": "Best Documentary Feature Film",
  "best-cinematography": "Best Cinematography",
  "best-cinematography-bw": "Best Cinematography (Black and White)",
  "best-film-editing": "Best Film Editing",
  "best-production-design": "Best Production Design",
  "best-production-design-bw": "Best Art Direction (Black and White)",
  "best-costume-design": "Best Costume Design",
  "best-costume-design-bw": "Best Costume Design (Black and White)",
  "best-makeup-hairstyling": "Best Makeup and Hairstyling",
  "best-visual-effects": "Best Visual Effects",
  "best-sound": "Best Sound",
  "best-sound-editing": "Best Sound Editing",
  "best-casting": "Best Casting",
  "best-original-score": "Best Original Score",
  "best-score-musical-adaptation": "Best Score (Musical or Adaptation)",
  "best-original-song": "Best Original Song",
  "best-animated-short": "Best Animated Short",
  "best-live-action-short": "Best Live Action Short Film",
  "best-live-action-short-two-reel": "Best Live Action Short Film (Two-Reel)",
  "best-live-action-short-color": "Best Live Action Short Film (Color)",
  "best-documentary-short": "Best Documentary Short",
  "best-assistant-director": "Best Assistant Director",
  "best-dance-direction": "Best Dance Direction",
  "unique-artistic-production": "Unique and Artistic Production",
};

type EraLabelRule = {
  /** Inclusive film-year upper bound. Omit for the open-ended latest name. */
  through?: number;
  label: string;
};

/**
 * Era-accurate labels, keyed by canonical id. First matching rule wins.
 *
 * Verified against awardsdatabase.oscars.org Exact Award Category on
 * 2026-09-16 (editions 28–40, 44–52, 71–81, 84–85, 91–96). Discrepancies
 * vs spec.md 5.3 are corrected here, not in the resolver:
 * - Sound Mixing begins with film year 2003 (76th), not 2008.
 * - Special Effects is still the name in 1963; 1964–1971 is Special Visual
 *   Effects; Visual Effects from 1972.
 * - Cinematography was unified (no Color/B&W split) in 1957 only; art
 *   direction and costume design were unified in 1957–1958, then split
 *   again until 1966.
 */
const CATEGORY_LABEL_RULES: Record<string, EraLabelRule[]> = {
  "best-cinematography": [
    { through: 1956, label: "Best Cinematography (Color)" },
    { through: 1957, label: "Best Cinematography" },
    { through: 1966, label: "Best Cinematography (Color)" },
    { label: "Best Cinematography" },
  ],
  "best-cinematography-bw": [
    { label: "Best Cinematography (Black and White)" },
  ],
  "best-production-design": [
    { through: 1956, label: "Best Art Direction (Color)" },
    { through: 1958, label: "Best Art Direction" },
    { through: 1966, label: "Best Art Direction (Color)" },
    { through: 2011, label: "Best Art Direction" },
    { label: "Best Production Design" },
  ],
  "best-production-design-bw": [
    { label: "Best Art Direction (Black and White)" },
  ],
  "best-costume-design": [
    { through: 1956, label: "Best Costume Design (Color)" },
    { through: 1958, label: "Best Costume Design" },
    { through: 1966, label: "Best Costume Design (Color)" },
    { label: "Best Costume Design" },
  ],
  "best-costume-design-bw": [
    { label: "Best Costume Design (Black and White)" },
  ],
  "best-international-feature": [
    { through: 2018, label: "Best Foreign Language Film" },
    { label: "Best International Feature Film" },
  ],
  "best-makeup-hairstyling": [
    { through: 2011, label: "Best Makeup" },
    { label: "Best Makeup and Hairstyling" },
  ],
  "best-visual-effects": [
    { through: 1963, label: "Best Special Effects" },
    { through: 1971, label: "Best Special Visual Effects" },
    { label: "Best Visual Effects" },
  ],
  "best-sound": [
    { through: 1957, label: "Best Sound Recording" },
    { through: 2002, label: "Best Sound" },
    { through: 2019, label: "Best Sound Mixing" },
    { label: "Best Sound" },
  ],
  "best-sound-editing": [
    { through: 1976, label: "Best Sound Effects" },
    { through: 1999, label: "Best Sound Effects Editing" },
    { label: "Best Sound Editing" },
  ],
  "best-documentary-feature": [
    { through: 2021, label: "Best Documentary Feature" },
    { label: "Best Documentary Feature Film" },
  ],
  "best-live-action-short": [
    { through: 1956, label: "Best Live Action Short Film (One Reel)" },
    { label: "Best Live Action Short Film" },
  ],
  "best-live-action-short-two-reel": [
    { label: "Best Live Action Short Film (Two-Reel)" },
  ],
  "best-score-musical-adaptation": [
    { label: "Best Score (Musical or Adaptation)" },
  ],
};

export function parseFilmYear(filmYearLabel: string): number {
  const trimmed = filmYearLabel.trim();
  const straddled = /^(\d{4})\/(\d{2})$/.exec(trimmed);
  if (straddled) {
    return Number(`${straddled[1].slice(0, 2)}${straddled[2]}`);
  }
  const year = Number(trimmed);
  if (!Number.isInteger(year)) {
    throw new Error(`Invalid film year label: ${filmYearLabel}`);
  }
  return year;
}

export function resolveCategoryLabel(
  categoryId: string,
  filmYear: number,
): string {
  const rules = CATEGORY_LABEL_RULES[categoryId];
  if (rules) {
    const match = rules.find(
      (rule) => rule.through === undefined || filmYear <= rule.through,
    );
    if (match) return match.label;
  }

  const base = CATEGORY_BASE_LABELS[categoryId];
  if (!base) {
    throw new Error(`Unknown category id: ${categoryId}`);
  }
  return base;
}

export function normalizeCategoryName(rawName: string): string {
  return rawName
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const BY_NORMALIZED_ALIAS = new Map<string, CategoryDefinition>();

for (const definition of CATEGORIES) {
  for (const alias of definition.aliases) {
    const key = normalizeCategoryName(alias);
    const existing = BY_NORMALIZED_ALIAS.get(key);
    if (existing && existing.id !== definition.id) {
      throw new Error(
        `Duplicate normalized alias "${key}" on ${existing.id} and ${definition.id}`,
      );
    }
    BY_NORMALIZED_ALIAS.set(key, definition);
  }
}

export function resolveCategoryId(
  rawName: string,
): CategoryDefinition | undefined {
  return BY_NORMALIZED_ALIAS.get(normalizeCategoryName(rawName));
}
