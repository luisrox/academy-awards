import { Emblem } from "@/components/deco/Emblem";

type RayDividerProps = {
  className?: string;
  size?: "sm" | "md";
};

/** Gold rule with the emblem at the center. `sm` is the overlay group mark. */
export function RayDivider({ className = "", size = "md" }: RayDividerProps) {
  const compact = size === "sm";
  return (
    <div
      role="separator"
      data-group-rule={compact || undefined}
      className={`flex items-center text-gold ${compact ? "gap-2" : "gap-4"} ${className}`.trim()}
    >
      <span className={`h-px flex-1 ${compact ? "bg-gold/30" : "bg-gold/45"}`} />
      <Emblem size={compact ? 12 : 22} className="shrink-0" />
      <span className={`h-px flex-1 ${compact ? "bg-gold/30" : "bg-gold/45"}`} />
    </div>
  );
}
