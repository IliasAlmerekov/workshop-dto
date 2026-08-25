import { describe, expect, it } from "vitest";
import {
  BLOOM_LEVELS,
  BLOOM_RESOLUTION_SCALE,
  DownscaledBloomEffect,
} from "./DownscaledBloom";

describe("the bloom's pixel budget", () => {
  it("quarters the pixels the veil is built from", () => {
    expect(BLOOM_RESOLUTION_SCALE * BLOOM_RESOLUTION_SCALE).toBe(0.25);
  });

  it("halves both axes before the buffers are sized, once and not repeatedly", () => {
    const bloom = new DownscaledBloomEffect({
      mipmapBlur: true,
      levels: BLOOM_LEVELS,
    });
    bloom.setSize(1600, 900);

    // What the luminance prepass and the mipmap chain are actually built from.
    expect(bloom.resolution.baseWidth).toBe(800);
    expect(bloom.resolution.baseHeight).toBe(450);

    // Idempotent: the same canvas size must not shrink the buffer again.
    bloom.setSize(1600, 900);
    expect(bloom.resolution.baseWidth).toBe(800);

    bloom.setSize(800, 450);
    expect(bloom.resolution.baseWidth).toBe(400);
    expect(bloom.resolution.baseHeight).toBe(225);
  });

  it("drops a mip level to hold the veil's reach at the smaller buffer", () => {
    expect(BLOOM_LEVELS).toBe(8 - Math.log2(1 / BLOOM_RESOLUTION_SCALE));
  });
});
