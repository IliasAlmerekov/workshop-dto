const LAYERS = ["Request DTO", "Mapper", "Entity", "Response DTO"] as const;

export type StackLayer = (typeof LAYERS)[number];

type IsometricStackProps = {
  size?: number;
  highlight?: StackLayer;
  className?: string;
};

/**
 * Orthographic projection of a flat card rotated by rotateZ(25°) then
 * rotateX(62°), expressed as an SVG matrix so the cards, their extruded
 * edges, and the labels all share one coordinate system.
 */
const PLANE = "matrix(0.906 0.198 -0.423 0.425 0 0)";

export function IsometricStack({
  size = 420,
  highlight = "Mapper",
  className,
}: IsometricStackProps) {
  const w = 300;
  const h = 150;
  const depth = 13;
  const gap = 96;
  const originX = 288;
  const originY = 132;

  // Where the card's left-hand corner (-w/2, +h/2) lands after PLANE, so the
  // connector lines can stop exactly there instead of dangling in mid-air.
  const leftCorner = {
    x: 0.906 * (-w / 2) - 0.423 * (h / 2),
    y: 0.198 * (-w / 2) + 0.425 * (h / 2),
  };

  return (
    <svg
      viewBox={`0 0 ${560} ${560}`}
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Data pipeline: request DTO, mapper, entity, and response DTO as stacked layers"
    >
      <defs>
        <linearGradient id="iso-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--glass-from)" />
          <stop offset="100%" stopColor="var(--glass-to)" />
        </linearGradient>
        <linearGradient id="iso-face-hl" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--glow)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--glow)" stopOpacity="0.2" />
        </linearGradient>
        <filter id="iso-glow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="14" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Connector lines and nodes, drawn in flat screen space to the left.
          Each line stops exactly at its card's left-hand corner. */}
      <g stroke="var(--muted)" strokeOpacity="0.45" strokeWidth="1">
        {LAYERS.map((_, index) => {
          const y = originY + index * gap + leftCorner.y;
          // All cards share the same left corner, so the nodes sit on one
          // vertical axis to keep every connector the same length.
          const nodeX = 48;
          const endX = originX + leftCorner.x - 10;
          return (
            <g key={index}>
              <path
                d={`M ${nodeX} ${y} H ${endX}`}
                fill="none"
                strokeDasharray="3 5"
              />
              <circle
                cx={nodeX}
                cy={y}
                r="3.6"
                fill="var(--accent)"
                fillOpacity="0.8"
                stroke="none"
              />
            </g>
          );
        })}
      </g>

      <g transform="translate(288 132)">
        {LAYERS.map((label, index) => {
          const isHighlighted = label === highlight;
          // Later layers sit lower on screen; render back-to-front.
          const dy = index * gap;

          return (
            <g key={label} transform={`translate(0 ${dy})`}>
              {/* Extruded edge: offset straight down in SCREEN space, since
                  that is the direction the card's thickness (its Z axis)
                  projects to. Offsetting inside PLANE instead would push it
                  down-left and read as a misaligned ghost. */}
              <g transform={`translate(0 ${depth}) ${PLANE}`}>
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx="26"
                  fill={isHighlighted ? "var(--glow)" : "var(--glass-edge)"}
                  fillOpacity={isHighlighted ? 0.55 : 0.55}
                />
              </g>
              <g transform={PLANE}>
                {/* Top face. */}
                <rect
                  x={-w / 2}
                  y={-h / 2}
                  width={w}
                  height={h}
                  rx="26"
                  fill={isHighlighted ? "url(#iso-face-hl)" : "url(#iso-face)"}
                  stroke="var(--glass-edge)"
                  strokeWidth="1.5"
                  filter={isHighlighted ? "url(#iso-glow)" : undefined}
                />
                <text
                  x="0"
                  y="0"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="26"
                  fontWeight="600"
                  fill={isHighlighted ? "var(--accent)" : "var(--muted)"}
                  fillOpacity={isHighlighted ? 1 : 0.85}
                  style={{
                    fontFamily: "var(--font-geist-sans), system-ui, sans-serif",
                  }}
                >
                  {label}
                </text>
              </g>
            </g>
          );
        })}
      </g>
    </svg>
  );
}
