/**
 * Pure, synchronously-callable capability checks (spec section 11's
 * "vollständiger 2D-Fallback ohne WebGL" and "prefers-reduced-motion wird
 * respektiert"). Kept separate from any component so both rules are unit
 * testable without needing a real WebGL context or a React tree.
 */

export function supportsWebGL(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

export function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Whether the 3D data pipeline may render at all. Reduced motion falls back
 * to the static 2D pipeline rather than a "motion-disabled" 3D scene: the
 * 2D SVG already has zero animation by construction, so it satisfies "a
 * complete calm experience" without needing every future 3D transition to
 * separately remember to check this flag.
 */
export function canRender3DPipeline(): boolean {
  return supportsWebGL() && !prefersReducedMotion();
}
