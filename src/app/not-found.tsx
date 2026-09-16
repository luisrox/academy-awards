import Link from "next/link";

export default function NotFound() {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/80 px-6">
      <section className="deco-frame max-w-lg bg-surface px-10 py-12 text-center">
        <p className="font-sans text-xs tracking-[0.3em] text-gold uppercase">
          Not found
        </p>
        <h1 className="mt-4 font-display text-4xl tracking-tight text-gold">
          This edition is not in the record
        </h1>
        <p className="mt-4 font-sans text-muted">
          There is no Academy Awards ceremony at this address.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block font-sans text-sm tracking-wide text-gold hover:text-gold-light"
        >
          Back to the grid
        </Link>
      </section>
    </div>
  );
}
