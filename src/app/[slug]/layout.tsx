import type { ReactNode } from "react";
import { CeremonyChrome } from "@/components/CeremonyOverlay";

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
  return <CeremonyChrome slug={slug}>{children}</CeremonyChrome>;
}
