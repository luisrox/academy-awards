import type { Metadata } from "next";
import {
  ambiguousYearRedirect,
  CEREMONIES,
  ceremonyDateLabel,
  ordinalSuffix,
} from "@/data/ceremonies";
import type { CeremonyDetail } from "@/lib/types";

/**
 * Public origin used for canonical URLs, Open Graph, sitemap and robots.
 * Override with NEXT_PUBLIC_SITE_URL in production.
 */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.oscars-winners.com";
  return raw.replace(/\/$/, "");
}

export function canonicalSlug(slug: string): string {
  return ambiguousYearRedirect(slug) ?? slug;
}

export function ceremonyPageTitle(detail: CeremonyDetail): string {
  const { ceremonyYear, ordinal } = detail.ceremony;
  return `${ceremonyYear} Oscar Winners \u2014 ${ordinalSuffix(ordinal)} Academy Awards`;
}

export function bestPictureWinnerName(detail: CeremonyDetail): string | undefined {
  for (const group of detail.groups) {
    for (const category of group.categories) {
      if (category.id !== "best-picture") continue;
      const winner = category.winners[0];
      return winner?.names[0] ?? winner?.movies[0]?.title;
    }
  }
  return undefined;
}

export function ceremonyPageDescription(detail: CeremonyDetail): string {
  const picture = bestPictureWinnerName(detail);
  const date = ceremonyDateLabel(detail.ceremony);
  const pictureLine = picture ? ` Best Picture: ${picture}.` : "";
  return `The ${ordinalSuffix(detail.ceremony.ordinal)} Academy Awards (${date}).${pictureLine} Films of ${detail.ceremony.filmYearLabel}.`;
}

export function ceremonyMetadata(detail: CeremonyDetail): Metadata {
  const title = ceremonyPageTitle(detail);
  const description = ceremonyPageDescription(detail);
  const path = `/${detail.ceremony.slug}`;
  const url = `${siteUrl()}${path}`;
  const image = `${url}/opengraph-image`;

  return {
    title,
    description,
    alternates: { canonical: path },
    robots: { index: true, follow: true },
    openGraph: {
      type: "article",
      siteName: "Oscars Winners",
      title,
      description,
      url,
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export function ceremonyJsonLd(detail: CeremonyDetail): Record<string, unknown> {
  const url = `${siteUrl()}/${detail.ceremony.slug}`;
  const awards = detail.groups.flatMap((group) =>
    group.categories.map((category) => ({
      "@type": "Award",
      name: category.label,
      winner: category.winners.map((entry) => ({
        "@type": entry.movies.length > 0 ? "Movie" : "Person",
        name:
          entry.names[0] ??
          entry.movies.map((movie) => movie.title).join(", "),
      })),
    })),
  );

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${ordinalSuffix(detail.ceremony.ordinal)} Academy Awards`,
    startDate: detail.ceremony.ceremonyDate,
    description: ceremonyPageDescription(detail),
    url,
    organizer: {
      "@type": "Organization",
      name: "Academy of Motion Picture Arts and Sciences",
    },
    award: awards,
  };
}

export function sitemapEntries(): { url: string; lastModified?: string }[] {
  const base = siteUrl();
  return [
    { url: `${base}/` },
    ...CEREMONIES.map((ceremony) => ({
      url: `${base}/${ceremony.slug}`,
      lastModified: ceremony.ceremonyDate,
    })),
  ];
}
