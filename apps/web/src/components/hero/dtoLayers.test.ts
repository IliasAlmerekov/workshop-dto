import { describe, expect, it } from "vitest";
import { layerSeparationOffset } from "./dtoLayers";

describe("pipeline layer separation", () => {
  it("pushes the upper and lower layers away from the stack centre", () => {
    const upper = layerSeparationOffset(0, 0.08, 0.04);
    const lower = layerSeparationOffset(3, 0.08, 0.04);

    expect(upper[0]).toBeCloseTo(0.12);
    expect(upper[1]).toBeCloseTo(-0.06);
    expect(lower[0]).toBeCloseTo(-0.12);
    expect(lower[1]).toBeCloseTo(0.06);
  });
});
