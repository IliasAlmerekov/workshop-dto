"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { wrapEffect } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { MathUtils, Vector3 } from "three";
import type { SceneQuality } from "@/lib/three/quality";
import type { Language } from "@/lib/workshop/types";
import { LensSurgeEffect } from "./LensSurgeEffect";
import { useCommitElapsed } from "./commitClock";
import { HERO_SURGE_OPTICS, heroSurge } from "./heroMotion";

const LensSurgePass = wrapEffect(LensSurgeEffect);

/**
 * Where the streaks converge, in world space: the middle of the four
 * boundaries, which is also what the camera is aimed just below.
 *
 * Projected per frame rather than derived from the layout, because the camera
 * carries a view offset that slides the frustum to wherever the page's column
 * is — including halfway down a scrolling phone. Projecting the point through
 * the same matrix everything else is drawn with is the only way the convergence
 * point cannot disagree with the object it belongs to.
 */
const STACK_CENTRE = new Vector3(0, -0.1, 0);

/** Six taps at the bottom tier, where the whole frame is fill-rate bound. */
const TAPS: Record<SceneQuality["tier"], number> = {
  low: 6,
  medium: 8,
  high: 10,
};

/**
 * The transition's optics, permanently in the chain.
 *
 * Mounted for the life of the scene at every quality tier and driven only
 * through its uniforms. Adding or removing it around the commit would rebuild
 * the composer's passes on the exact frames the commit is being drawn on — a
 * shader compile and a render-target reallocation landing inside a 500ms move,
 * which is a stutter where the whole point is a clean hit.
 *
 * At rest `uProgress` is 0 and the shader returns the frame it was handed after
 * one fetch and one branch, so the resting cost of keeping it here is a pass
 * that copies the image.
 */
export function LensSurge({
  quality,
  reducedMotion,
  selectedTrack,
}: {
  quality: SceneQuality;
  reducedMotion: boolean;
  selectedTrack: Language | null;
}) {
  const effect = useRef<LensSurgeEffect>(null);
  const args = useMemo(
    () => [{ taps: TAPS[quality.tier] }] as [{ taps: number }],
    [quality.tier],
  );
  const elapsedSince = useCommitElapsed(selectedTrack);
  const centre = useMemo(() => new Vector3(), []);
  const invalidate = useThree((state) => state.invalidate);

  useFrame(({ clock, camera, size }) => {
    const instance = effect.current;
    if (!instance) {
      return;
    }

    const progressUniform = instance.uniforms.get("uProgress");
    if (!progressUniform) {
      return;
    }

    const elapsed = reducedMotion ? null : elapsedSince(clock.getElapsedTime());
    const progress = elapsed === null ? 0 : heroSurge(elapsed);

    if (progress <= 0) {
      // Written unconditionally on the way down, so the last frame of the
      // surge cannot leave a fraction of a smear latched on screen.
      if (progressUniform.value !== 0) {
        progressUniform.value = 0;
        invalidate();
      }
      return;
    }

    centre.copy(STACK_CENTRE).project(camera);
    instance.uniforms.get("uCentre")?.value.set(
      // Clamped generously rather than to the frame: the stack may sit outside
      // the viewport on a narrow page, and the rays should still aim at it.
      MathUtils.clamp(centre.x * 0.5 + 0.5, -0.5, 1.5),
      MathUtils.clamp(centre.y * 0.5 + 0.5, -0.5, 1.5),
    );
    const aspectUniform = instance.uniforms.get("uAspect");
    if (aspectUniform) {
      aspectUniform.value = Math.max(
        0.1,
        size.width / Math.max(1, size.height),
      );
    }

    progressUniform.value = progress;
    const blurUniform = instance.uniforms.get("uBlurIntensity");
    if (blurUniform) {
      blurUniform.value = HERO_SURGE_OPTICS.blur;
    }
    const dispersionUniform = instance.uniforms.get("uDispersion");
    if (dispersionUniform) {
      dispersionUniform.value = HERO_SURGE_OPTICS.dispersion;
    }
    invalidate();
  });

  return (
    <LensSurgePass ref={effect} args={args} blendFunction={BlendFunction.SRC} />
  );
}
