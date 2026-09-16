import { describe, expect, it } from "vitest";
import {
  ceremonyDetailSchema,
  historicalRecordSchema,
  parseData,
} from "./schemas";

const validRecord = {
  category: "Best Picture",
  year: "2023",
  nominees: ["Oppenheimer"],
  movies: [
    { title: "Oppenheimer", tmdb_id: 872585, imdb_id: "tt15398776" },
  ],
  won: true,
};

const validCeremony = {
  ordinal: 96,
  ceremonyYear: 2024,
  ceremonyDate: "2024-03-10",
  filmYearLabel: "2023",
  slug: "2024",
  decade: "2020s",
};

describe("historicalRecordSchema", () => {
  it("accepts a valid source record", () => {
    expect(parseData(historicalRecordSchema, validRecord)).toEqual(validRecord);
  });

  it("fails when won is missing and the message names won", () => {
    const { category, year, nominees, movies } = validRecord;
    expect(() =>
      parseData(historicalRecordSchema, { category, year, nominees, movies }, "source"),
    ).toThrow(/won/);
  });

  it("includes the full path of a nested invalid field", () => {
    const nested = {
      ...validRecord,
      movies: [{ tmdb_id: 1 }],
    };
    expect(() => parseData(historicalRecordSchema, nested, "source")).toThrow(
      /movies\.0\.title/,
    );
  });
});

describe("ceremonyDetailSchema", () => {
  it("fails when a category has no winners", () => {
    const detail = {
      ceremony: validCeremony,
      groups: [
        {
          id: "headline",
          label: "The Big Two",
          categories: [
            {
              id: "best-picture",
              label: "Best Picture",
              winners: [],
              nominees: [{ names: ["A Film"], movies: [{ title: "A Film" }] }],
            },
          ],
        },
      ],
    };

    expect(() => parseData(ceremonyDetailSchema, detail, "detail")).toThrow(
      /winners/,
    );
  });
});
