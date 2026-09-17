import { z } from "zod";

/**
 * Runtime schemas are the source of truth for generated artifacts and the
 * historical feed. Types in types.ts are `z.infer` of these schemas so a
 * shape change cannot silently desync the TypeScript view from validation.
 * SearchDoc is validated with the other generated artifacts.
 */

export const categoryGroupSchema = z.enum([
  "headline",
  "acting",
  "writing",
  "feature",
  "craft",
  "music",
  "shorts",
  "retired",
  "special",
]);

export const historicalMovieSchema = z.object({
  title: z.string().min(1),
  tmdb_id: z.number().int().nullish(),
  imdb_id: z.string().nullish(),
});

export const historicalRecordSchema = z.object({
  category: z.string().min(1),
  year: z.string().min(1),
  nominees: z.array(z.string()),
  movies: z.array(historicalMovieSchema),
  won: z.boolean(),
});

export const ceremonySchema = z.object({
  ordinal: z.number().int().min(1),
  ceremonyYear: z.number().int(),
  ceremonyDate: z.iso.date(),
  filmYearLabel: z.string().min(1),
  slug: z.string().min(1),
  decade: z.string().min(1),
});

export const movieSchema = z.object({
  title: z.string().min(1),
  tmdbId: z.number().int().optional(),
  imdbId: z.string().optional(),
  posterPath: z.string().optional(),
});

export const entrySchema = z.object({
  names: z.array(z.string()),
  movies: z.array(movieSchema),
});

export const ceremonyCategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  winners: z.array(entrySchema).min(1),
  nominees: z.array(entrySchema),
});

export const ceremonyCategoryGroupSchema = z.object({
  id: categoryGroupSchema,
  label: z.string().min(1),
  categories: z.array(ceremonyCategorySchema).min(1),
});

export const ceremonyDetailSchema = z.object({
  ceremony: ceremonySchema,
  groups: z.array(ceremonyCategoryGroupSchema).min(1),
});

export const headlineWinnerSchema = z.object({
  category: z.string().min(1),
  winner: z.string().min(1),
  movie: z.string().optional(),
});

export const gridEntrySchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  subtitle: z.string().min(1),
  decade: z.string().min(1),
  ordinal: z.number().int().min(1),
  headline: z.array(headlineWinnerSchema).min(1),
  posterPath: z.string().optional(),
});

export const searchKindSchema = z.enum(["year", "film", "person"]);

export const searchDocSchema = z.object({
  slug: z.string().min(1),
  label: z.string().min(1),
  kind: searchKindSchema,
  title: z.string().min(1),
  detail: z.string().min(1),
  won: z.boolean(),
});

export type CategoryGroup = z.infer<typeof categoryGroupSchema>;
export type HistoricalMovie = z.infer<typeof historicalMovieSchema>;
export type HistoricalRecord = z.infer<typeof historicalRecordSchema>;
export type Ceremony = z.infer<typeof ceremonySchema>;
export type Movie = z.infer<typeof movieSchema>;
export type Entry = z.infer<typeof entrySchema>;
export type CeremonyCategory = z.infer<typeof ceremonyCategorySchema>;
export type CeremonyCategoryGroup = z.infer<typeof ceremonyCategoryGroupSchema>;
export type CeremonyDetail = z.infer<typeof ceremonyDetailSchema>;
export type HeadlineWinner = z.infer<typeof headlineWinnerSchema>;
export type GridEntry = z.infer<typeof gridEntrySchema>;
export type SearchKind = z.infer<typeof searchKindSchema>;
export type SearchDoc = z.infer<typeof searchDocSchema>;

/** Joins Zod issue paths so a nested failure names the exact field. */
export function formatZodIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
      return `${path}: ${issue.message}`;
    })
    .join("; ");
}

export function parseData<S extends z.ZodType>(
  schema: S,
  data: unknown,
  source = "data",
): z.infer<S> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  throw new Error(`${source}: ${formatZodIssues(result.error)}`);
}
