import { notFound, redirect } from "next/navigation";
import { CeremonyDetail } from "@/components/CeremonyOverlay";
import {
  ambiguousBareYearSlugs,
  ambiguousYearRedirect,
} from "@/data/ceremonies";
import { getAllSlugs, getCeremonyDetail } from "@/lib/ceremony-data";

export function generateStaticParams() {
  return [...getAllSlugs(), ...ambiguousBareYearSlugs()].map((slug) => ({
    slug,
  }));
}

export const dynamicParams = false;

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
  return <CeremonyDetail detail={detail} />;
}
