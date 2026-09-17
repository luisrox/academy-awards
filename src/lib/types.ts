/**
 * Application types are inferred from src/lib/schemas.ts. That is the chosen
 * guarantee that schema and type stay aligned: there is only one definition.
 * Compatibility tests would still allow the two copies to be edited apart.
 *
 * SearchDoc is inferred with the other artifacts since search.json exists.
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
  SearchDoc,
} from "./schemas";
