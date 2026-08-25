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

export type SceneQuality = {
  tier: SceneQualityTier;
  /** `dpr` range handed to the R3F canvas: [min, max]. */
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
  },
  medium: {
    tier: "medium",
    dpr: [1, 1.6],
    transmissionResolutionScale: 0.9,
    environmentResolution: 512,
  },
  high: {
    tier: "high",
    dpr: [1, 2],
    transmissionResolutionScale: 1,
    environmentResolution: 1024,
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
