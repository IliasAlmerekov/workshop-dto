/**
 * How expensive the hero's glass scene is allowed to be on this device.
 *
 * The physical glass, HDRI and contact shadows all scale with canvas
 * resolution. Rather than shipping one setting that is either ugly on
 * a workstation or unusable on a laptop, the scene reads a tier from cheap
 * device hints. The function is pure so the tiers can be asserted without a
 * GPU.
 */

export type SceneQualityTier = "low" | "medium" | "high";

/**
 * The ceiling on the canvas's device pixel ratio, at every tier.
 *
 * Not a quality decision — a budget one. Cost in this scene is fill rate, not
 * geometry: four extruded slabs and a displaced disc are trivial, while the
 * composer runs several fullscreen fetch-and-write passes over every pixel of a
 * canvas that covers the whole viewport. Pixels are quadratic in this ratio, so
 * a 2× Retina display asks for 1.8 times the work of 1.5 and 4 times the work of
 * 1 — which on a wide display is the difference between a 60fps hero and a 30fps
 * one, for a sharpness nobody can point at on a near-white matte surface.
 *
 * 1.5 is where that trade stops paying. Below it the slabs' rolled rims start
 * showing steps against the field, which is the one edge in the composition the
 * eye tracks; above it the extra samples land on snow.
 */
export const MAX_DEVICE_PIXEL_RATIO = 1.5;

export type SceneQuality = {
  tier: SceneQualityTier;
  /**
   * `dpr` range handed to the R3F canvas: [min, max]. The maximum never exceeds
   * `MAX_DEVICE_PIXEL_RATIO`, whatever the display reports.
   */
  dpr: [number, number];
  /**
   * Fraction of the canvas the renderer's transmission buffer is rendered at.
   * The slabs refract whatever that buffer holds, so it decides how sharply
   * the studio sweep and the labels below read through the glass — and it is
   * the single most expensive knob in the scene, since it re-renders the
   * whole opaque pass once per frame.
   */
  transmissionResolutionScale: number;
  /**
   * Environment map edge length, in pixels. The HDRI's softboxes are what the
   * polished coat reflects, so this is the difference between a rim highlight
   * with an edge and a pale smear.
   */
  environmentResolution: number;
  /**
   * Edge length of the sun's shadow map, in pixels — or `0` for no shadow at
   * all.
   *
   * The one budget in here that is allowed to reach zero. Every other knob
   * trades sharpness for speed and the scene survives at either end, but a
   * shadow map is a second render of the whole stack from a second camera, and
   * on the tier that is already fill-rate bound that cost buys a soft grey bar
   * the device then has to filter. The stack's contact with the ground is
   * carried by real displaced geometry regardless, so the low tier loses the
   * cast shadow and keeps the press — which is the half of the contact that was
   * doing the work.
   */
  shadowMapSize: number;
};

export type DeviceHints = {
  /** `navigator.hardwareConcurrency` */
  cores?: number;
  /** `window.devicePixelRatio` */
  pixelRatio?: number;
  /** `navigator.deviceMemory`, in GiB — Chromium only. */
  memoryGb?: number;
  /** True when the primary pointer is coarse, i.e. a touch device. */
  coarsePointer?: boolean;
};

const QUALITY: Record<SceneQualityTier, SceneQuality> = {
  low: {
    tier: "low",
    dpr: [1, 1],
    transmissionResolutionScale: 0.65,
    environmentResolution: 256,
    shadowMapSize: 0,
  },
  medium: {
    tier: "medium",
    // Below the ceiling rather than at it: this tier is the mid device, and it
    // renders the same passes as the top one with less to render them with.
    dpr: [1, 1.25],
    transmissionResolutionScale: 0.9,
    environmentResolution: 512,
    shadowMapSize: 1024,
  },
  high: {
    tier: "high",
    dpr: [1, MAX_DEVICE_PIXEL_RATIO],
    transmissionResolutionScale: 1,
    environmentResolution: 1024,
    shadowMapSize: 2048,
  },
};

/**
 * A coarse pointer caps the tier at `low` regardless of core count: phone GPUs
 * report generous `hardwareConcurrency` while being an order of magnitude
 * slower at the fill-rate-bound work refraction actually does.
 */
export function pickSceneQuality(hints: DeviceHints = {}): SceneQuality {
  const { cores, pixelRatio, memoryGb, coarsePointer } = hints;

  if (coarsePointer) {
    return QUALITY.low;
  }
  if (memoryGb !== undefined && memoryGb <= 4) {
    return QUALITY.low;
  }
  if (cores !== undefined && cores <= 4) {
    return QUALITY.low;
  }
  if (cores !== undefined && cores >= 8 && (pixelRatio ?? 1) <= 2) {
    return QUALITY.high;
  }
  return QUALITY.medium;
}

/** Reads the hints `pickSceneQuality` wants from the live browser. */
export function readDeviceHints(): DeviceHints {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return {};
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    cores: nav.hardwareConcurrency,
    pixelRatio: window.devicePixelRatio,
    memoryGb: nav.deviceMemory,
    coarsePointer:
      typeof window.matchMedia === "function"
        ? window.matchMedia("(pointer: coarse)").matches
        : undefined,
  };
}
