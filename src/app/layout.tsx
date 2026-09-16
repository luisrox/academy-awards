import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { DecadeNav } from "@/components/DecadeNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { YearGrid } from "@/components/YearGrid";
import { getGridEntries } from "@/lib/ceremony-data";
import { siteUrl } from "@/lib/seo";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-playfair",
  weight: ["400", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  display: "optional",
  preload: false,
  variable: "--font-inter",
  weight: ["400"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "Oscars Winners",
    template: "%s",
  },
  description: "Every Academy Awards ceremony, in two clicks.",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Oscars Winners",
    title: "Oscars Winners",
    description: "Every Academy Awards ceremony, in two clicks.",
    url: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const entries = getGridEntries();
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="deco-grain flex min-h-screen flex-col bg-ink font-sans text-muted antialiased">
        <SiteHeader />
        <DecadeNav />
        <main className="relative flex-1">
          <YearGrid entries={entries} />
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
