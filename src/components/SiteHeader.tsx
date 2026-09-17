import Link from "next/link";
import { Emblem } from "@/components/deco/Emblem";
import { SearchPalette } from "./SearchPalette";

export function SiteHeader() {
  return (
    <header className="stage-sticky flex items-center justify-between border-b border-gold/25 px-6 py-4">
      <h1 className="m-0 font-display text-xl font-normal tracking-wide">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gold hover:text-gold-light"
        >
          <Emblem size={28} />
          Oscars Winners
        </Link>
      </h1>
      <div data-slot="search">
        <SearchPalette />
      </div>
    </header>
  );
}