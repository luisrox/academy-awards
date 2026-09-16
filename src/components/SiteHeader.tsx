import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="flex items-center justify-between border-b border-gold/25 px-6 py-4">
      <h1 className="m-0 font-display text-xl font-normal tracking-wide">
        <Link href="/" className="text-gold hover:text-gold-light">
          Oscars Winners
        </Link>
      </h1>
      {/* Search lands here in step 27. Empty on purpose until then. */}
      <div data-slot="search" className="h-9 w-9" />
    </header>
  );
}
