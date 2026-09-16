import { notFound } from "next/navigation";
import { CeremonyOverlay } from "@/components/CeremonyOverlay";
import { getAllSlugs, getCeremonyDetail } from "@/lib/ceremony-data";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export const dynamicParams = false;

export default async function CeremonyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = getCeremonyDetail(slug);
  if (!detail) notFound();
  return <CeremonyOverlay detail={detail} />;
}
