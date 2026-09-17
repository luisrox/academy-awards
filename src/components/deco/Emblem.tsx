/**
 * Original Art Déco award mark (spec.md 8.6).
 *
 * Distinction rules — do not add any of these when editing:
 * 1. Sin figura humana, ni desnuda ni estilizada.
 * 2. Sin espada, brazos cruzados ni postura frontal rígida.
 * 3. Sin base cilíndrica con carrete de película de cinco radios.
 * 4. Sin las proporciones de la estatuilla (figura alargada de pie sobre
 *    base estrecha). Lo que sí es: copa geométrica cerrada sobre plinto
 *    escalonado, media corona de laurel y rayos de sunburst.
 */
const RAY_ANGLES = [-70, -50, -30, -12, 12, 30, 50, 70] as const;

export function EmblemGraphic({ color = "currentColor" }: { color?: string }) {
  return (
    <g>
      <g
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="square"
      >
        {RAY_ANGLES.map((angle) => (
          <line
            key={angle}
            x1="32"
            y1="20"
            x2="32"
            y2="6"
            transform={`rotate(${angle} 32 20)`}
          />
        ))}
      </g>
      <path
        fill={color}
        d="M18 22h28l-1.5 2.5H19.5L18 22Zm3 4h22l-3.5 9H24.5L21 26Z"
      />
      <rect fill={color} x="29" y="35" width="6" height="5" />
      <rect fill={color} x="25" y="40" width="14" height="3.5" />
      <rect fill={color} x="21" y="43.5" width="22" height="3.5" />
      <rect fill={color} x="16" y="47" width="32" height="5" />
      <g fill={color}>
        <path d="M14 39l3 2-3 2-3-2z" />
        <path d="M10 44l3 2-3 2-3-2z" />
        <path d="M13 49l3 2-3 2-3-2z" />
        <path d="M50 39l3 2-3 2-3-2z" />
        <path d="M54 44l3 2-3 2-3-2z" />
        <path d="M51 49l3 2-3 2-3-2z" />
      </g>
    </g>
  );
}

type EmblemProps = {
  size?: number;
  className?: string;
  title?: string;
};

export function Emblem({ size = 24, className = "", title }: EmblemProps) {
  const labelled = Boolean(title);
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden={labelled ? undefined : true}
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
    >
      {labelled ? <title>{title}</title> : null}
      <EmblemGraphic />
    </svg>
  );
}