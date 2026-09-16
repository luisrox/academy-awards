import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { CeremonyDetail } from "@/components/CeremonyOverlay";
import {
  ambiguousBareYearSlugs,
  ambiguousYearRedirect,
} from "@/data/ceremonies";
import { getAllSlugs, getCeremonyDetail } from "@/lib/ceremony-data";
import {
  canonicalSlug,
  ceremonyJsonLd,
  ceremonyMetadata,
} from "@/lib/seo";

export function generateStaticParams() {
  return [...getAllSlugs(), ...ambiguousBareYearSlugs()].map((slug) => ({
    slug,
  }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = getCeremonyDetail(canonicalSlug(slug));
  if (!detail) return {};
  return ceremonyMetadata(detail);
}

export default async function CeremonyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonical = ambiguousYearRedirect(slug);
  if (canonical) redirect(`/${canonical}`);
  const detail = getCeremonyDetail(slug);
  if (!detail) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ceremonyJsonLd(detail)) }}
      />
      <CeremonyDetail detail={detail} />
    </>
  );
}
