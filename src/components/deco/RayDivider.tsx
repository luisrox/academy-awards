import { Emblem } from "@/components/deco/Emblem";

/** Decade rule: emblem at the center, gold lines on either side. */
export function RayDivider({ className = "" }: { className?: string }) {
  return (
    <div
      role="separator"
      className={`flex items-center gap-4 text-gold ${className}`.trim()}
    >
      <span className="h-px flex-1 bg-gold/45" />
      <Emblem size={22} className="shrink-0" />
      <span className="h-px flex-1 bg-gold/45" />
    </div>
  );
}