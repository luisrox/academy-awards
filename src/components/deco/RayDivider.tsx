/** Art Deco rising-sun divider. Rays and a diamond — never a statuette. */
export function RayDivider({ className = "" }: { className?: string }) {
  const rays = [-70, -55, -40, -25, -12, 0, 12, 25, 40, 55, 70];
  return (
    <div
      role="separator"
      className={`flex items-center gap-4 text-gold ${className}`.trim()}
    >
      <span className="h-px flex-1 bg-gold/45" />
      <svg
        aria-hidden="true"
        viewBox="0 0 64 28"
        className="h-7 w-16 shrink-0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      >
        <g transform="translate(32 26)">
          {rays.map((angle) => (
            <line
              key={angle}
              x1="0"
              y1="0"
              x2="0"
              y2="-22"
              transform={`rotate(${angle})`}
            />
          ))}
        </g>
        <rect
          x="29.5"
          y="21.5"
          width="5"
          height="5"
          transform="rotate(45 32 24)"
          fill="currentColor"
          stroke="none"
        />
      </svg>
      <span className="h-px flex-1 bg-gold/45" />
    </div>
  );
}
