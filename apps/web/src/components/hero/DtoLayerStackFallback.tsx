import {
  DTO_LAYERS,
  RESTING_ACCENT_LAYER_INDEX,
  fittedLabelSize,
} from "./dtoLayers";
import { trackDeclaration } from "./trackDeclarations";
import type { Language } from "@/lib/workshop/types";
import {
  CONNECTOR_NODE_TONES,
  HERO_SEPARATION_FLAT,
  TRACK_FOCUS_LAYER_INDEX,
} from "./heroMotion";

/**
 * The no-WebGL stack. It is not a picture of the glass scene — it is the same
 * composition drawn flat: four equal slabs on one isometric axis, the active
 * stage carrying the violet accent, and the same dashed leaders. The Request
 * DTO is the resting active stage in both renderers, and a language preview
 * confirms it rather than moving it.
 *
 * The live scene's material is a volume, which this one cannot be. What it can
 * carry across is the reason the volume reads: the lit face is a gradient, not
 * a fill — bright at the far corner where the glass would be thin, deepening
 * into the attenuation colour towards the near one. The passive faces get the
 * same treatment at a fraction of the range, so the flat stack has the same
 * one-lit-boundary structure instead of four identical grey parallelograms.
 */
export const STACK_DESCRIPTION =
  "The four layers the workshop works through, stacked: request DTO, mapper, entity, response DTO.";

const TOP = 176;
const PITCH = 150;
const THICKNESS = 26;

/**
 * The two screen-space axes of a top face: along the slab's width, and along
 * its depth. Labels are placed with them as a matrix, so they lie on the face
 * the way the live scene's labels do instead of sitting at a guessed angle.
 */
const WIDTH_AXIS = [272, -72] as const;
const DEPTH_AXIS = [140, 78] as const;
const WIDTH_LENGTH = Math.hypot(...WIDTH_AXIS);
const DEPTH_LENGTH = Math.hypot(...DEPTH_AXIS);
/** Scene units → SVG units, from the slab's width in each space. */
const UNIT = WIDTH_LENGTH / 4.05;

const LABEL_FILL = {
  ink: "#0a0a0a",
  accent: "#15139c",
  muted: "#26262c",
  cool: "#6673b3",
} as const;

/**
 * The three top-face corners the visible side walls hang from: the left
 * corner, the near corner, and the right corner of the same parallelogram the
 * `face` path draws.
 */
function corners(index: number) {
  const left = 210 - index * 20;
  const top = TOP + index * PITCH;
  return {
    left: [left, top],
    near: [left + 140, top + 78],
    right: [left + 412, top + 6],
  } as const;
}

function facePath(index: number) {
  const { left, near, right } = corners(index);
  return [
    `M${left[0]} ${left[1]}`,
    `L${left[0] + WIDTH_AXIS[0]} ${left[1] + WIDTH_AXIS[1]}`,
    `L${right[0]} ${right[1]}`,
    `L${near[0]} ${near[1]}`,
    "Z",
  ].join(" ");
}

export function DtoLayerStackFallback({
  className,
  activeTrack = null,
  selectedTrack = null,
  focusLayerIndex = null,
  expanded = false,
  hovered = false,
  description = STACK_DESCRIPTION,
}: {
  className?: string;
  activeTrack?: Language | null;
  /**
   * The committed track, which is the one that renames the two DTO boundaries.
   * A no-WebGL device is not a reduced-motion device — it still watches the full
   * transition before the route changes — so it gets the same answer to its
   * choice, drawn with what SVG has.
   */
  selectedTrack?: Language | null;
  /** Index into `DTO_LAYERS` to accent, overriding the track-derived one. */
  focusLayerIndex?: number | null;
  expanded?: boolean;
  /** The pointer is over the illustration: open the stack further. */
  hovered?: boolean;
  description?: string;
}) {
  const trackIndex = activeTrack ? TRACK_FOCUS_LAYER_INDEX : null;
  const activeLayerIndex =
    focusLayerIndex ?? trackIndex ?? RESTING_ACCENT_LAYER_INDEX;
  const emphasised = focusLayerIndex !== null || activeTrack !== null;
  // Mirrors the live scene: the two separations add rather than replace, so
  // hovering an already-previewed stack opens it further.
  const separation =
    (expanded ? HERO_SEPARATION_FLAT.picker : 0) +
    (hovered ? HERO_SEPARATION_FLAT.hover : 0);

  return (
    <div
      className={`relative ${className ?? ""}`}
      role="img"
      aria-label={description}
    >
      <svg
        aria-hidden="true"
        className="h-full w-full"
        viewBox="0 0 722 941"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="stack-glow">
            <stop offset="0" stopColor="#6b6bf2" stopOpacity="0.34" />
            <stop offset="0.55" stopColor="#8a8af6" stopOpacity="0.12" />
            <stop offset="1" stopColor="#a3a3f4" stopOpacity="0" />
          </radialGradient>
          {/* The lit face, read along the slab's own depth axis and aimed the
              same way the live scene's studio is: the left corner catches the
              softbox, and the far right sits deepest in the lavender core. The
              two renderers are not the same picture, but a viewer who sees
              only one of them should not be able to tell which. */}
          <linearGradient
            id="active-face-sweep"
            x1="0.1"
            y1="0.14"
            x2="0.92"
            y2="0.9"
          >
            <stop offset="0" stopColor="#fbfbff" />
            <stop offset="0.34" stopColor="#e4e4fc" />
            <stop offset="0.72" stopColor="#c2c2f8" />
            <stop offset="1" stopColor="#9c9cf2" />
          </linearGradient>
          <linearGradient
            id="passive-face-sweep"
            x1="0.1"
            y1="0.14"
            x2="0.92"
            y2="0.9"
          >
            <stop offset="0" stopColor="#fcfcfe" />
            <stop offset="0.55" stopColor="#eeeef2" />
            <stop offset="1" stopColor="#dfe1ea" />
          </linearGradient>
          {/* The side walls take the same light one step darker, so the two
              faces of a slab never read as one flat shape. */}
          <linearGradient id="active-side-sweep" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#e6e6fb" />
            <stop offset="1" stopColor="#c9c9f4" />
          </linearGradient>
          <linearGradient id="passive-side-sweep" x1="0" y1="0" x2="0.3" y2="1">
            <stop offset="0" stopColor="#eceef4" />
            <stop offset="1" stopColor="#d6d8e1" />
          </linearGradient>
        </defs>

        <ellipse
          cx="396"
          cy={TOP + RESTING_ACCENT_LAYER_INDEX * PITCH + 3}
          rx="330"
          ry="205"
          fill="url(#stack-glow)"
          style={{
            transform: `translateY(${
              (activeLayerIndex - RESTING_ACCENT_LAYER_INDEX) * PITCH +
              (activeLayerIndex - 1.5) * separation
            }px)`,
          }}
          className="transition-transform duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        />

        <path
          data-connector-network="line"
          d="M96 154V656"
          fill="none"
          stroke="#a8b2e8"
          strokeDasharray="7 10"
        />

        {DTO_LAYERS.map((layer, index) => {
          const face = facePath(index);
          const active = index === activeLayerIndex;
          const labelFill = emphasised
            ? active
              ? LABEL_FILL.accent
              : layer.tone === "ink"
                ? LABEL_FILL.ink
                : LABEL_FILL.muted
            : LABEL_FILL[layer.tone];
          const { left, near, right } = corners(index);
          const nodeY = TOP + index * PITCH;
          const declaration = trackDeclaration(selectedTrack, layer.id);
          /** Signed distance from the stack's centre — what makes it a fan. */
          const fan = index - (DTO_LAYERS.length - 1) / 2;
          const labelMatrix = [
            `matrix(${WIDTH_AXIS[0] / WIDTH_LENGTH}`,
            `${WIDTH_AXIS[1] / WIDTH_LENGTH}`,
            `${DEPTH_AXIS[0] / DEPTH_LENGTH}`,
            `${DEPTH_AXIS[1] / DEPTH_LENGTH}`,
            `${left[0] + (WIDTH_AXIS[0] + DEPTH_AXIS[0]) / 2 + layer.labelShift * UNIT * (WIDTH_AXIS[0] / WIDTH_LENGTH)}`,
            `${left[1] + (WIDTH_AXIS[1] + DEPTH_AXIS[1]) / 2 + layer.labelShift * UNIT * (WIDTH_AXIS[1] / WIDTH_LENGTH)})`,
          ].join(" ");
          const side = [
            `M${left[0]} ${left[1]}`,
            `L${near[0]} ${near[1]}`,
            `L${right[0]} ${right[1]}`,
            `l0 ${THICKNESS}`,
            `L${near[0]} ${near[1] + THICKNESS}`,
            `L${left[0]} ${left[1] + THICKNESS}`,
            "Z",
          ].join(" ");

          return (
            <g
              key={layer.id}
              data-layer-id={layer.id}
              data-active={String(active)}
              data-expanded={String(expanded)}
              style={{
                transform: separation
                  ? `translateY(${(index - 1.5) * separation}px)`
                  : "translateY(0)",
              }}
              className="transition-transform duration-[460ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
            >
              {/* The commit's flinch lives on its own group: the outer one
                  already carries the picker and hover separation as an inline
                  transform, and one element cannot hold two. */}
              <g
                key={selectedTrack ? `committed-${selectedTrack}` : "resting"}
                className={selectedTrack ? "hero-stack-fan" : undefined}
                style={{ "--fan": fan } as React.CSSProperties}
              >
                <path
                  d={side}
                  fill={
                    active
                      ? "url(#active-side-sweep)"
                      : "url(#passive-side-sweep)"
                  }
                  stroke={active ? "#c8c8fa" : "#e0e1e9"}
                  strokeWidth="1.5"
                />
                <path
                  d={face}
                  fill={
                    active
                      ? "url(#active-face-sweep)"
                      : "url(#passive-face-sweep)"
                  }
                  stroke={active ? "#c8c8fa" : "#ffffff"}
                  strokeWidth="2"
                />
                <path
                  data-connector-network="line"
                  d={`M96 ${nodeY}H${190 - index * 20}`}
                  fill="none"
                  stroke="#c4c5cf"
                  strokeDasharray="7 10"
                />
                <circle
                  data-connector-node="static"
                  data-tone={CONNECTOR_NODE_TONES[index]}
                  cx="96"
                  cy={nodeY}
                  r="6"
                  fill={
                    CONNECTOR_NODE_TONES[index] === "accent"
                      ? "#4a6bfa"
                      : "#c2c3cd"
                  }
                  opacity={CONNECTOR_NODE_TONES[index] === "accent" ? 0.9 : 0.5}
                />
                <text
                  data-layer-label="role"
                  className={
                    declaration ? "hero-stack-role--replaced" : undefined
                  }
                  fill={labelFill}
                  fontFamily="Inter, sans-serif"
                  fontSize={layer.labelSize * UNIT}
                  fontWeight="500"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={labelMatrix}
                >
                  {layer.label}
                </text>

                {/* The chosen track's own name for this boundary. Only the two
                  DTOs get one; the mapper and the entity are not renamed by a
                  language choice. */}
                {declaration ? (
                  <text
                    data-layer-label="declaration"
                    className="hero-stack-declaration"
                    fill={labelFill}
                    fontFamily="Inter, sans-serif"
                    fontSize={
                      fittedLabelSize(declaration, layer.labelSize * 0.88) *
                      UNIT
                    }
                    fontWeight="500"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={labelMatrix}
                  >
                    {declaration}
                  </text>
                ) : null}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
