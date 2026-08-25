/**
 * The four boundaries the workshop teaches, as one ordered list.
 *
 * The live 3D scene reads its label, order and accent decisions from here.
 * `Mapper` owns the resting accent from the reference. Language preview moves
 * that same inner light and blue label across the four stages without changing
 * this structural list. The live scene and no-WebGL fallback both consume it,
 * so their labels and resting emphasis cannot drift apart.
 *
 * The four slabs are identical in size — the stack is a sequence of equal
 * boundaries, not a hierarchy of them. The label sizes fall away with depth
 * so the eye lands on `Request DTO` first and `Mapper` second. The falloff is
 * deliberately shallow: `Entity` is the furthest slab that still carries a
 * neutral-ink label, and below roughly 0.24 it stops being readable against
 * the bright frost at all — a receding label, not an unreadable one. Every
 * label is geometrically centred on its slab in both the live and fallback
 * scenes.
 */

export const DTO_LAYERS = [
  {
    id: "request-dto",
    label: "Request DTO",
    accent: false,
    labelSize: 0.3,
    labelShift: 0,
    tone: "ink",
  },
  {
    id: "mapper",
    label: "Mapper",
    accent: true,
    labelSize: 0.275,
    labelShift: 0,
    tone: "accent",
  },
  {
    id: "entity",
    label: "Entity",
    accent: false,
    labelSize: 0.24,
    labelShift: 0,
    tone: "muted",
  },
  {
    id: "response-dto",
    label: "Response DTO",
    accent: false,
    labelSize: 0.265,
    labelShift: 0,
    tone: "cool",
  },
] as const;

export type DtoLayer = (typeof DTO_LAYERS)[number];

/** Reference spacing between the four resting layers. Hover adds only a small
 * transient Y/Z repulsion on top of this authored composition. */
export const LAYER_PITCH = 1.85;

/** Figma keeps the four left edges on one visual axis. */
export const LAYER_DRIFT_X = 0;

/**
 * One slab: a thick cast-glass block, not a pane.
 *
 * `radius` rounds the four corners in plan; `bevel` rounds the top and bottom
 * rims by the same amount all the way around. Both matter for the material —
 * a hard rim reflects the studio in a single thin line, while a rounded one
 * sweeps the softbox across a few millimetres of glass and produces the wide
 * white highlight the reference lives on. `height` is what makes that rim read
 * at all: the light has to travel far enough through the block for its
 * attenuation colour to show.
 *
 * The ratio between the two is what decides whether the block reads as cast
 * glass or as a bar of soap. At a bevel of 0.1 over a height of 0.5, the rolled
 * rim was 40% of the block's whole thickness and there was no flat wall left
 * between the two rolls for the studio to fall on — every edge went pillowy.
 * Held near 28%, the roll still sweeps the softbox and the wall between them
 * still reads as a wall.
 */
export const SLAB = {
  width: 4.05,
  depth: 2.22,
  height: 0.44,
  radius: 0.4,
  bevel: 0.062,
} as const;

/** Resting position of a layer, top layer first. */
export function layerPosition(index: number): [number, number, number] {
  const centreOffset = ((DTO_LAYERS.length - 1) / 2) * LAYER_PITCH;
  return [index * LAYER_DRIFT_X, centreOffset - index * LAYER_PITCH, 0];
}

/**
 * Symmetric offset away from the stack centre. Indices increase downwards,
 * while world-space Y increases upwards, hence the opposite Y sign.
 */
export function layerSeparationOffset(
  index: number,
  yAmount: number,
  zAmount: number,
): [number, number] {
  const spread = index - (DTO_LAYERS.length - 1) / 2;
  return [-spread * yAmount, spread * zAmount];
}
