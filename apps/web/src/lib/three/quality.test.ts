import { describe, expect, it } from "vitest";
import { MAX_DEVICE_PIXEL_RATIO, pickSceneQuality } from "./quality";

describe("pickSceneQuality", () => {
  it("caps a touch device at the cheapest tier even with many cores", () => {
    const quality = pickSceneQuality({ cores: 12, coarsePointer: true });

    expect(quality.tier).toBe("low");
    expect(quality.transmissionResolutionScale).toBe(0.65);
  });

  it("uses the full tier on a many-core desktop", () => {
    const quality = pickSceneQuality({
      cores: 16,
      pixelRatio: 2,
      coarsePointer: false,
    });

    expect(quality.tier).toBe("high");
    expect(quality.transmissionResolutionScale).toBe(1);
  });

  it("drops to the cheapest tier on a low-core machine", () => {
    expect(pickSceneQuality({ cores: 4 }).tier).toBe("low");
  });

  it("drops to the cheapest tier on a memory-constrained machine", () => {
    expect(pickSceneQuality({ cores: 16, memoryGb: 4 }).tier).toBe("low");
  });

  it("lands in the middle when hints are absent", () => {
    expect(pickSceneQuality().tier).toBe("medium");
  });

  it("never renders past the pixel ceiling, whatever the display reports", () => {
    for (const pixelRatio of [1, 2, 3, 4]) {
      for (const hints of [
        { pixelRatio, coarsePointer: true },
        { pixelRatio, cores: 6 },
        { pixelRatio, cores: 16 },
      ]) {
        const [, max] = pickSceneQuality(hints).dpr;
        expect(max, JSON.stringify(hints)).toBeLessThanOrEqual(
          MAX_DEVICE_PIXEL_RATIO,
        );
      }
    }
  });

  it("never asks a weaker tier for more pixels than a stronger one", () => {
    const low = pickSceneQuality({ coarsePointer: true }).dpr[1];
    const medium = pickSceneQuality().dpr[1];
    const high = pickSceneQuality({ cores: 16, pixelRatio: 1 }).dpr[1];

    expect(low).toBeLessThanOrEqual(medium);
    expect(medium).toBeLessThanOrEqual(high);
  });

  it("never returns a dpr range whose floor exceeds its ceiling", () => {
    for (const hints of [
      { coarsePointer: true },
      { cores: 6 },
      { cores: 16, pixelRatio: 1 },
    ]) {
      const [min, max] = pickSceneQuality(hints).dpr;
      expect(min).toBeLessThanOrEqual(max);
    }
  });
});
