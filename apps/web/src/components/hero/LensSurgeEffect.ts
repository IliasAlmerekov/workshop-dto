import { BlendFunction, Effect, EffectAttribute } from "postprocessing";
import { Uniform, Vector2 } from "three";

/**
 * What a lens does when the camera lunges.
 *
 * The commit is a camera move: the moment a track is chosen the rig starts
 * pushing in on the stack, and this is the artefact that move leaves on the
 * image. Not a glitch borrowed from a broken video signal — the two things a
 * real lens produces under that acceleration, and nothing else:
 *
 *  - a **radial smear** along every ray out of the stack's own centre, because
 *    a zoom traces each point of the image away from the optical axis while the
 *    shutter is open. The vanishing point does not move; the frame edge moves
 *    furthest. That is why the streaks converge on the boundaries rather than on
 *    the middle of the browser window.
 *  - **transverse chromatic aberration**, because the glass does not focus red
 *    and blue at the same magnification. It is zero on axis and grows outwards,
 *    which is precisely where a lens puts it and precisely where a bolted-on RGB
 *    split does not.
 *
 * Both fall out of one tap loop: each channel reads the same streak at its own
 * scale, so the dispersion is *inside* the smear instead of layered over it.
 * That is cheaper than two passes and it is also the only arrangement that
 * looks like one optical event rather than two effects agreeing to fire.
 *
 * Every tap moves *towards* the convergence point, i.e. towards the smaller
 * magnification the zoom is arriving from. Two consequences, both wanted: the
 * trail reads as the frames the camera has just left, and no sample can leave
 * the input buffer, so there is no clamped-edge streaking anywhere on a canvas
 * whose corners are meant to become the page.
 *
 * The effect stays mounted for the life of the scene and is driven entirely by
 * `uProgress` / `uBlurIntensity`. It never joins or leaves the chain — a
 * composer rebuilt mid-transition would drop the transition it exists to draw.
 * At rest the shader costs one texture fetch and one branch.
 */
const FRAGMENT = /* glsl */ `
uniform float uProgress;
uniform float uBlurIntensity;
uniform float uDispersion;
uniform vec2 uCentre;
uniform float uAspect;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  if (uProgress < 0.002) {
    outputColor = inputColor;
    return;
  }

  vec2 offset = uv - uCentre;

  // Corrected for the canvas aspect, so the falloff below is a circle on
  // screen instead of an ellipse stretched by the window's proportions.
  float radius = length(vec2(offset.x * uAspect, offset.y));

  // Quadratic in the radius: nearly still on axis, hardest in the corners.
  // A linear reach smears the subject as much as its surroundings, which is
  // the difference between a lens moving and a filter being applied.
  float reach = uProgress * uBlurIntensity * (0.22 + radius * radius * 3.4);
  vec2 stride = -offset * reach / float(SURGE_TAPS);

  // The channels' own magnifications. Zero on axis; the outer frame carries
  // the fringe, which is where dispersion actually lives.
  vec2 split = -offset * uDispersion * uProgress * (0.18 + radius);

  vec4 accum = vec4(0.0);
  float total = 0.0;

  for (int i = 0; i < SURGE_TAPS; i++) {
    float t = float(i);
    // A bright head and a fading tail: the trail is where the image was, and
    // it was there for less of the exposure than where it is now.
    float weight = 1.0 - (t / float(SURGE_TAPS)) * 0.74;
    vec2 base = uv + stride * t;

    accum.r += texture2D(inputBuffer, base + split).r * weight;
    accum.g += texture2D(inputBuffer, base).g * weight;
    accum.b += texture2D(inputBuffer, base - split).b * weight;
    accum.a += texture2D(inputBuffer, base).a * weight;
    total += weight;
  }

  outputColor = accum / total;
}
`;

export type LensSurgeOptions = {
  /**
   * Samples along each streak. Six is the floor at which the trail reads as a
   * smear rather than as a row of ghosts; past ten the extra taps are paying
   * for a difference nobody sees in half a second.
   */
  taps?: number;
};

export class LensSurgeEffect extends Effect {
  constructor({ taps = 10 }: LensSurgeOptions = {}) {
    super("LensSurge", FRAGMENT, {
      // It reads the input buffer away from the current fragment, which is
      // what earns this effect a pass of its own.
      attributes: EffectAttribute.CONVOLUTION,
      // The surge replaces the frame rather than tinting it: the taps already
      // include the untouched image as their first, heaviest sample.
      blendFunction: BlendFunction.SRC,
      defines: new Map([
        ["SURGE_TAPS", String(Math.max(3, Math.round(taps)))],
      ]),
      uniforms: new Map<string, Uniform>([
        /** 0 at rest, 1 at the peak of the lunge. */
        ["uProgress", new Uniform(0)],
        /** Streak length at the frame edge, as a fraction of the frame. */
        ["uBlurIntensity", new Uniform(0)],
        /** Channel separation at the frame edge, same units. */
        ["uDispersion", new Uniform(0)],
        /** Where the rays converge, in UV — the stack, not the window. */
        ["uCentre", new Uniform(new Vector2(0.5, 0.5))],
        ["uAspect", new Uniform(1)],
      ]),
    });
  }
}
