import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { CeremonyChrome } from "@/components/CeremonyOverlay";
import { ambiguousYearRedirect } from "@/data/ceremonies";

/**
 * Overlay chrome lives here so prev/next slug changes keep the dialog
 * mounted: focus trap and scroll lock survive edition navigation.
 */
export default async function CeremonyLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const canonical = ambiguousYearRedirect(slug);
  if (canonical) redirect(`/${canonical}`);
  return <CeremonyChrome slug={slug}>{children}</CeremonyChrome>;
}
