import { describe, expect, it } from "vitest";
import { balloonContainsPoint, balloonTargetY } from "./BalloonsPopBackground";

describe("BalloonsPopBackground", () => {
  it("settles each balloon immediately below the workshop header", () => {
    expect(balloonTargetY(79, 24)).toBe(109);
  });

  it("recognises pointer hover within the balloon body", () => {
    const balloon = { drawX: 140, drawY: 110, radius: 24 };

    expect(balloonContainsPoint(balloon, 140, 110)).toBe(true);
    expect(balloonContainsPoint(balloon, 140, 142)).toBe(false);
  });
});
