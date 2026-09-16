import { DecoFrame } from "@/components/deco/DecoFrame";
import { RayDivider } from "@/components/deco/RayDivider";
import { PALETTE } from "@/lib/palette";

const SWATCHES: { name: string; hex: string; sample: string }[] = [
  { name: "ink", hex: PALETTE.ink, sample: "bg-ink" },
  { name: "surface", hex: PALETTE.surface, sample: "bg-surface" },
  { name: "gold", hex: PALETTE.gold, sample: "bg-gold" },
  { name: "gold-light", hex: PALETTE.goldLight, sample: "bg-gold-light" },
  { name: "muted", hex: PALETTE.muted, sample: "bg-muted" },
];

/** Temporary specimen. Replaced by the ceremony grid in step 15. */
export default function DesignSpecimenPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-12 px-6 py-16">
      <header className="flex flex-col gap-3">
        <p className="font-sans text-xs tracking-[0.35em] text-gold uppercase">
          Design tokens
        </p>
        <h1 className="font-display text-5xl font-semibold tracking-tight text-gold">
          Oscars Winners
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted">
          Art Deco specimen: type, palette, geometric frame, ray divider, and
          focus. No Academy statuette — the motif is public-domain geometry.
        </p>
      </header>

      <RayDivider />

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-sm tracking-[0.2em] text-gold uppercase">
          Hierarchy
        </h2>
        <p className="font-display text-6xl font-semibold text-gold">2026</p>
        <p className="font-display text-3xl text-gold-light">
          One Battle after Another
        </p>
        <p className="text-sm text-muted">Sinners — nominee, never competing</p>
      </section>

      <DecoFrame className="bg-surface p-8">
        <p className="font-display text-xl text-gold-light">Geometric frame</p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          One-pixel gold rule, inset echo, stepped corners. Grain sits on the
          page, not in this box.
        </p>
        <a
          href="#focus-target"
          className="mt-6 inline-block font-sans text-sm text-gold underline-offset-4 hover:text-gold-light hover:underline"
        >
          Tab here to see the focus ring
        </a>
      </DecoFrame>

      <section id="focus-target" className="flex flex-col gap-4">
        <h2 className="font-display text-sm tracking-[0.2em] text-gold uppercase">
          Palette
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {SWATCHES.map((swatch) => (
            <li key={swatch.name} className="flex flex-col gap-2">
              <div
                className={`deco-frame h-16 ${swatch.sample}`}
                aria-hidden="true"
              />
              <p className="font-sans text-xs tracking-wide text-muted">
                {swatch.name}
              </p>
              <p className="font-sans text-xs text-gold">{swatch.hex}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
