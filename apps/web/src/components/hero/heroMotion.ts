import type { Language } from "@/lib/workshop/types";
import { DTO_LAYERS } from "./dtoLayers";

export const HERO_TRANSITION_MS = 1050;

/**
 * The commit surge: how long the lens artefact of the camera's lunge lasts.
 *
 * One envelope drives everything the commit does — the streaks and the
 * dispersion in `LensSurgeEffect`, the slabs' fan, and the light impulse that
 * runs down the stack. Peaked rather than monotonic: it arrives faster than
 * anyone can follow, then releases over four times as long. That asymmetry is
 * the whole reading. A symmetric swell reads as an effect being applied to the
 * scene; something that snaps and then settles reads as the scene having been
 * *hit*, which is what choosing a track is.
 *
 * ~510ms end to end, inside `HERO_TRANSITION_MS`, so the surge has resolved and
 * the stack is visibly settling back into its isometric rest before the route
 * changes. The artefact must never be the last thing on screen — that would
 * hand the visitor a broken frame as their final impression of the hero.
 */
export const HERO_SURGE = {
  attackS: 0.085,
  releaseS: 0.425,
  /**
   * Per-slab delay of the light impulse, top boundary first.
   *
   * Four slabs at this offset spread the wave over 165ms — long enough to read
   * as something travelling *through* the stack rather than four blocks lighting
   * at once, short enough that it never reads as four separate events.
   */
  staggerS: 0.055,
} as const;

export const HERO_SURGE_TOTAL_S = HERO_SURGE.attackS + HERO_SURGE.releaseS;

/**
 * The surge envelope, as a pure function of seconds since the commit.
 *
 * Smoothstep up so the attack has no corner on it, then a power release that
 * lands on exactly 0 at `HERO_SURGE_TOTAL_S` — an exponential decay would leave
 * a fraction of a pixel of smear on screen forever and keep the demand loop
 * awake for it.
 */
export function heroSurge(elapsedS: number): number {
  if (!Number.isFinite(elapsedS) || elapsedS <= 0) {
    return 0;
  }
  if (elapsedS < HERO_SURGE.attackS) {
    const t = elapsedS / HERO_SURGE.attackS;
    return t * t * (3 - 2 * t);
  }
  const t = (elapsedS - HERO_SURGE.attackS) / HERO_SURGE.releaseS;
  if (t >= 1) {
    return 0;
  }
  return Math.pow(1 - t, 2.6);
}

/**
 * Streak length and channel separation at the frame edge, as a fraction of the
 * frame, at the peak of the surge.
 *
 * Read against a near-white scene, which is the constraint. Snow has almost no
 * local contrast for a smear to work with, so the blur has to be long enough to
 * displace whole forms — the labels, the slabs' rims — before it is legible at
 * all. The dispersion is an eighth of it: any more and the fringe stops being an
 * artefact of the glass and starts being a colour in the palette, which this
 * system does not have a slot for.
 */
export const HERO_SURGE_OPTICS = {
  blur: 0.115,
  dispersion: 0.014,
} as const;

/**
 * The inscription re-press: how long a boundary's label takes to become the
 * chosen language's own declaration.
 *
 * Monotonic, unlike the surge, because this one is a state change and not a
 * flinch — the label does not come back. It rides inside the surge's release so
 * the swap happens while the frame is smeared, which is what makes two different
 * strings at the same coordinates read as one being replaced rather than as a
 * hard cut.
 */
export const HERO_LABEL_SWAP = {
  leadS: 0.04,
  durationS: 0.34,
} as const;

/**
 * How long the live canvas takes to dissolve in over the glass loading study,
 * and how long that study takes to dissolve out under it. The exit is shorter
 * than the entrance so the two overlap for most of the handover instead of
 * dipping to an empty frame in the middle — the moment that used to read as
 * the illustration "popping" into place.
 */
export const HERO_REVEAL_MS = 420;
export const HERO_LOADER_EXIT_MS = 360;

/**
 * The slabs' opening move, in seconds, because the scene measures time on the
 * three.js clock rather than in CSS.
 *
 * It is deliberately short: the entrance plays *inside* the reveal crossfade,
 * so a long tail would leave the stack visibly drifting after the material has
 * already settled. `stagger` is per layer from the top, `lead` delays the whole
 * move so a little material is on screen before anything travels, and
 * `idleRampS` is how long the ambient float takes to reach full amplitude once
 * the entrance lands — ramped rather than switched on, so no layer jumps.
 */
export const HERO_INTRO = {
  durationS: 0.9,
  staggerS: 0.07,
  leadS: 0.06,
  idleRampS: 0.9,
} as const;

/** Total wall time of the opening move, top layer to last layer settling. */
export const HERO_INTRO_TOTAL_S =
  HERO_INTRO.leadS + HERO_INTRO.staggerS * 3 + HERO_INTRO.durationS;

/**
 * How long the scene renders every vsync frame after motion is triggered.
 * Covers both the opening move and a track commit, after which the ambient
 * float alone does not justify a full-rate loop.
 */
export const HERO_BUSY_MS = 1400;

/** Vsync frames per rendered frame once only the ambient float is running. */
export const HERO_IDLE_FRAME_STRIDE = 3;

/**
 * Stage travel of the hover preview card. The card is shown tens of times per
 * session while scrubbing the picker, so it stays well under the reveal.
 */
export const HERO_PREVIEW_MS = 460;

/**
 * How long the card's language name and snippet take to dissolve into the next
 * ones while scrubbing the picker.
 *
 * Shorter than the card's own travel: this is a value changing inside a card
 * that is already in place, not the card arriving. Scrubbing the four languages
 * is a hover-frequency gesture, so it has to keep up with the pointer — but a
 * hard swap at the same coordinates read as a glitch rather than as a change,
 * which is what a crossfade at this length fixes.
 */
export const HERO_TRACK_TEXT_MS = 220;

export type ConnectorNodeTone = "accent" | "muted";

/**
 * The connector nodes are one static four-beat motif. They describe the shared
 * pipeline and therefore do not react to a language preview.
 */
export const CONNECTOR_NODE_TONES: readonly [
  ConnectorNodeTone,
  ConnectorNodeTone,
  ConnectorNodeTone,
  ConnectorNodeTone,
] = ["accent", "accent", "muted", "muted"];

/**
 * Two separations act on the stack, and they add up rather than replace one
 * another:
 *
 *  - `PICKER` opens the stack a little while a language card is previewed, so
 *    the track card has a stage to point at;
 *  - `HOVER` opens it further when the pointer is over the illustration itself.
 *
 * Hovering the stack is the one gesture whose only subject *is* the stack, so
 * it earns the larger of the two. The answer it gives — these are four separate
 * boundaries, not one solid block — is the whole point of the illustration, and
 * pulling them apart is the most direct way to say it.
 *
 * Values are per unit of distance from the stack's centre, so the outer panes
 * travel three times as far as the inner ones and the stack fans rather than
 * shifts. Against `LAYER_PITCH` of 1.85 the outermost pane moves about 13%
 * during card preview, 20% over the object, and 33% when both states meet:
 * large enough to make the four boundaries unmistakable, still short of
 * breaking the composition apart.
 */
export const HERO_SEPARATION = {
  picker: { y: 0.16, z: 0.08 },
  hover: { y: 0.25, z: 0.15 },
} as const;

/**
 * `MathUtils.damp` decay for each. The picker separation is a side effect of
 * aiming at a card and can afford to be languid; the hover separation is direct
 * manipulation — the pointer is on the object — so it has to answer promptly.
 * At 6 it settles in roughly 250ms, inside the budget for a hover.
 */
export const HERO_SEPARATION_DAMP = {
  picker: 3.7,
  hover: 6,
} as const;

/**
 * The same two separations for the no-WebGL stack, in its SVG user units.
 * `PITCH` there is 150, so these are scaled to read as the same gesture.
 */
export const HERO_SEPARATION_FLAT = {
  picker: 24,
  hover: 32,
} as const;

/**
 * Every track points at the same boundary.
 *
 * The four languages used to own a stage each — one per slab, top to bottom —
 * but a language does not own a pipeline stage, and the mapping was arbitrary in
 * a place the eye reads as meaningful.
 *
 * So the preview points at the boundary the choice actually decides: the
 * **Request DTO**, the first thing the participant writes in whichever language
 * they pick — which is also the stack's resting accent, so previewing a track
 * confirms the composition rather than relocating its one lit slab. Resolved by
 * id rather than by position, so reordering `DTO_LAYERS` cannot silently move
 * the accent somewhere else.
 */
export const TRACK_FOCUS_LAYER_INDEX = DTO_LAYERS.findIndex(
  (layer) => layer.id === "request-dto",
);

/**
 * How many characters a snippet may be before it outgrows the card.
 *
 * The card is 118px wide with a 1px border and 12px of padding either side, so
 * 92px of it is content. JetBrains Mono advances 0.6em, which at the snippet's
 * 8px is 4.8px per character — 19 of them. That is not a coincidence: the
 * measured width hugs `final class UserDTO`, the longest snippet the design was
 * drawn around. A snippet over budget does not wrap, it runs out past the
 * border, which is how `type UserDTO = { … }` escaped review at 20.
 */
export const TRACK_SNIPPET_MAX_CHARS = 19;

export const TRACK_PREVIEWS: Record<
  Language,
  { label: string; snippet: string; cameraYaw: number }
> = {
  java: {
    label: "Java",
    snippet: "record UserDTO(…)",
    cameraYaw: -3,
  },
  python: {
    label: "Python",
    snippet: "class UserDTO: …",
    cameraYaw: -1.6,
  },
  php: {
    label: "PHP",
    snippet: "final class UserDTO",
    cameraYaw: 1.6,
  },
  typescript: {
    label: "TypeScript",
    snippet: "type UserDTO = {…}",
    cameraYaw: 3,
  },
};
