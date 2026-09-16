import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { DecadeNav } from "@/components/DecadeNav";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { YearGrid } from "@/components/YearGrid";
import { getGridEntries } from "@/lib/ceremony-data";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Oscars Winners",
  description: "Every Academy Awards ceremony, in two clicks.",
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
        <div className="flex-1">
          <YearGrid entries={entries} />
          {children}
        </div>
        <SiteFooter />
      </body>
    </html>
  );
}
