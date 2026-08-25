"use client";

import { wrapEffect } from "@react-three/postprocessing";
import { BloomEffect } from "postprocessing";

/**
 * How much of each axis the bloom's internal buffers cover.
 *
 * Half in each direction, so a quarter of the pixels. Bloom is the one pass in
 * this chain that can take that without an argument: it is a veil, the lowest
 * spatial frequency anything in the frame has, and it is read after being blurred
 * across several mip levels. There is nothing at the top of its frequency range
 * for full resolution to preserve — every texel the full-size buffer holds is
 * thrown away by the blur that follows it.
 *
 * The pixels, on the other hand, are real. A luminance prepass and a mip chain
 * over the whole canvas are two fullscreen fetch-and-write passes per frame, and
 * at a device ratio of 1.5 on a wide display that is several million texels of
 * bandwidth spent on a gradient. Fill rate is what this scene runs out of first —
 * four extruded slabs and a displaced disc are nothing next to the composer.
 */
export const BLOOM_RESOLUTION_SCALE = 0.5;

/**
 * `mipmapBlur` bloom at a quarter of the canvas's pixels.
 *
 * A subclass rather than the `resolutionScale` prop, because that prop does not
 * do this. `BloomEffect.setSize` forwards the full canvas size to the luminance
 * pass and the mipmap blur pass and only applies `resolution` to `renderTarget`
 * and `blurPass` — neither of which is used once `mipmapBlur` is on. Setting
 * `resolutionScale={0.25}` on a mipmap bloom therefore costs exactly as much as
 * setting nothing, which is the kind of optimisation that is worse than none: it
 * reads as done.
 *
 * Scaling `setSize` is the one place that reaches both passes. Downstream nothing
 * changes: the result is sampled through the effect's own `map` uniform at the
 * output pass's uv, so a smaller texture is simply read with the bilinear filter
 * it already had.
 */
export class DownscaledBloomEffect extends BloomEffect {
  /**
   * True while a scaled size is being applied.
   *
   * `BloomEffect`'s constructor subscribes to its own `resolution` and reacts to
   * a change by calling `this.setSize(resolution.baseWidth, …)` — which lands
   * back here. Scaling that call too would scale the already-scaled size, and
   * since each pass sets a new base size and fires the event again, the buffer
   * halves on every round until it bottoms out at a single pixel and the bloom
   * disappears. The re-entrant call is a reapplication, not a new canvas size,
   * so it is forwarded untouched; `Resolution.setBaseSize` only dispatches on an
   * actual change, so the second pass finds nothing to change and it ends there.
   */
  private rescaling = false;

  override setSize(width: number, height: number): void {
    if (this.rescaling) {
      super.setSize(width, height);
      return;
    }

    this.rescaling = true;
    try {
      super.setSize(
        Math.max(1, Math.round(width * BLOOM_RESOLUTION_SCALE)),
        Math.max(1, Math.round(height * BLOOM_RESOLUTION_SCALE)),
      );
    } finally {
      this.rescaling = false;
    }
  }
}

/**
 * One mip level fewer than the full-resolution chain.
 *
 * Each level's blur reaches a fixed fraction of the buffer it is built on, so
 * halving the buffer doubles how far every level reaches across the finished
 * frame. Left at the default the veil would spread twice as wide as the one
 * DESIGN.md measured — a visible change of look smuggled in under a performance
 * change. Dropping a level puts the reach back where it was.
 */
export const BLOOM_LEVELS = 7;

export const DownscaledBloom = wrapEffect(DownscaledBloomEffect);
