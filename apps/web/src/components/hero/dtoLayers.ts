/**
 * The four boundaries the workshop teaches, as one ordered list.
 *
 * The live 3D scene reads its label, order and accent decisions from here.
 * `Request DTO` owns the resting accent: it is the first boundary a
 * participant writes in whichever track they pick, so the resting emphasis and
 * the one a language preview lands on are the same slab, and choosing a track
 * confirms the composition instead of relocating it. The live scene and
 * no-WebGL fallback both consume this list, so their labels and resting
 * emphasis cannot drift apart.
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
    accent: true,
    labelSize: 0.3,
    labelShift: 0,
    tone: "accent",
  },
  {
    id: "mapper",
    label: "Mapper",
    accent: false,
    labelSize: 0.275,
    labelShift: 0,
    tone: "ink",
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

/**
 * The slab that carries the accent when nothing else is asking for attention.
 *
 * Resolved from the list's own `accent` flag rather than written as a literal,
 * so the live scene, the no-WebGL fallback and the loading skeleton cannot
 * disagree about which boundary is lit, and reordering `DTO_LAYERS` cannot
 * silently move the emphasis somewhere else.
 */
export const RESTING_ACCENT_LAYER_INDEX = DTO_LAYERS.findIndex(
  (layer) => layer.accent,
);

/** Reference spacing between the four resting layers. Hover adds only a small
 * transient Y/Z repulsion on top of this authored composition. */
export const LAYER_PITCH = 1.85;

/** Figma keeps the four left edges on one visual axis. */
export const LAYER_DRIFT_X = 0;

/**
 * How far forward on its own face each inscription sits, in world units.
 *
 * Not centred, and the reason is occlusion rather than composition. The camera
 * looks down on the stack from roughly forty degrees, so the ray from any point
 * on a slab's face to the lens rises 1.41 units before it clears the underside
 * of the slab above and travels 1.23 units towards the viewer doing it. Every
 * point further back than about 0.12 behind centre is therefore hidden by the
 * next boundary up — which is where a centred label's trailing half was, and
 * why `Response DTO` used to arrive with its first glyphs eaten.
 *
 * The previous scene hid the problem by drawing the labels with depth testing
 * off, which traded a clipped string for a worse one: all four inscriptions
 * were then composited in front of all four slabs, so the bottom boundary's
 * name printed itself across the top boundary's face.
 *
 * This is the actual fix, and it is camera-independent in the direction that
 * matters: the near strip of a face is visible from any viewpoint above the
 * stack, whatever the elevation, because the occluder is always directly above
 * and always the same size. 0.36 clears the boundary with room for the label's
 * own half-height and for the transient Z the hover repulsion adds, and still
 * leaves half a unit of face between the last descender and the rolled edge.
 */
export const LABEL_DEPTH = 0.36;

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

/**
 * How much of a slab's top face an inscription may use, in world units.
 *
 * Not the full width: a label that reaches the rounded corners sits on the part
 * of the block where the bevel is already turning away from the sky, so its last
 * glyphs read against a gradient rather than against the flat face.
 */
export const LABEL_FIT_WIDTH = SLAB.width * 0.84;

/**
 * Mean advance of the scene's label face at size 1, measured across the strings
 * actually drawn on the slabs. Inter Medium's own average over mixed case, near
 * enough that a 20-character string lands within a glyph of its true width.
 */
const LABEL_MEAN_ADVANCE = 0.55;

/**
 * The largest size at which `text` still fits its slab, capped at `preferred`.
 *
 * The role labels were authored to fit and do not need this. The track
 * declarations do: `final class UserRequest` is twice the length of `Request
 * DTO`, and a string over budget does not wrap on a slab — it runs off the rim.
 * Sizing down rather than truncating keeps the inscription complete, which is
 * the only version of it that teaches anything.
 */
export function fittedLabelSize(text: string, preferred: number): number {
  const width = Math.max(1, text.length) * LABEL_MEAN_ADVANCE;
  return Math.min(preferred, LABEL_FIT_WIDTH / width);
}
