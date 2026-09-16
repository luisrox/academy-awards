/**
 * Application types are inferred from src/lib/schemas.ts. That is the chosen
 * guarantee that schema and type stay aligned: there is only one definition.
 * Compatibility tests would still allow the two copies to be edited apart.
 *
 * SearchDoc remains handmade here; its Zod schema arrives with search.json.
 */
export type {
  CategoryGroup,
  Ceremony,
  CeremonyCategory,
  CeremonyCategoryGroup,
  CeremonyDetail,
  Entry,
  GridEntry,
  HeadlineWinner,
  HistoricalRecord,
  Movie,
} from "./schemas";

export type SearchDoc = {
  slug: string;
  label: string;
  kind: "year" | "film" | "person";
  title: string;
  detail: string;
  won: boolean;
};
