import { describe, expect, it } from "vitest";
import { DTO_LAYERS } from "./dtoLayers";
import {
  CONNECTOR_NODE_TONES,
  HERO_LABEL_SWAP,
  HERO_SURGE,
  HERO_SURGE_TOTAL_S,
  HERO_TRANSITION_MS,
  TRACK_FOCUS_LAYER_INDEX,
  TRACK_PREVIEWS,
  TRACK_SNIPPET_MAX_CHARS,
  heroSurge,
} from "./heroMotion";

describe("hero track focus", () => {
  it("points every track at the Request DTO, the boundary the choice decides", () => {
    expect(DTO_LAYERS[TRACK_FOCUS_LAYER_INDEX].id).toBe("request-dto");
  });

  it("keeps one static connector-node motif for the shared pipeline", () => {
    expect(CONNECTOR_NODE_TONES).toHaveLength(4);
    expect(
      CONNECTOR_NODE_TONES.filter((tone) => tone === "accent"),
    ).toHaveLength(2);
    expect(
      CONNECTOR_NODE_TONES.filter((tone) => tone === "muted"),
    ).toHaveLength(2);
  });

  it("gives each track a label and a snippet, and nothing that moves the accent", () => {
    for (const [language, preview] of Object.entries(TRACK_PREVIEWS)) {
      expect(preview.label, language).toBeTruthy();
      expect(preview.snippet, language).toBeTruthy();
      // A per-track stage would put the accent somewhere the language does not
      // actually own; the focus is one shared boundary, not four.
      expect(preview, language).not.toHaveProperty("layerIndex");
    }
  });

  it("keeps every snippet inside the card it is drawn in", () => {
    // The card is a fixed width and the snippet does not wrap — an over-budget
    // string runs out past the border instead of failing loudly, so the budget
    // is asserted rather than eyeballed.
    for (const [language, preview] of Object.entries(TRACK_PREVIEWS)) {
      expect(
        preview.snippet.length,
        `${language}: ${preview.snippet}`,
      ).toBeLessThanOrEqual(TRACK_SNIPPET_MAX_CHARS);
    }
  });
});

describe("the commit surge", () => {
  it("stays inside the window the brief allows the artefact", () => {
    expect(HERO_SURGE_TOTAL_S * 1000).toBeGreaterThanOrEqual(400);
    expect(HERO_SURGE_TOTAL_S * 1000).toBeLessThanOrEqual(600);
  });

  it("resolves well before the route changes, so the last frame is settled", () => {
    const wave = HERO_SURGE_TOTAL_S + HERO_SURGE.staggerS * (4 - 1);
    expect(wave * 1000).toBeLessThan(HERO_TRANSITION_MS);
  });

  it("starts and ends at exactly nothing", () => {
    expect(heroSurge(0)).toBe(0);
    expect(heroSurge(-1)).toBe(0);
    expect(heroSurge(HERO_SURGE_TOTAL_S)).toBe(0);
    expect(heroSurge(HERO_SURGE_TOTAL_S + 5)).toBe(0);
  });

  it("peaks at the end of the attack and never overshoots", () => {
    expect(heroSurge(HERO_SURGE.attackS)).toBeCloseTo(1, 5);
    for (let t = 0; t <= HERO_SURGE_TOTAL_S; t += 0.005) {
      expect(heroSurge(t)).toBeLessThanOrEqual(1);
      expect(heroSurge(t)).toBeGreaterThanOrEqual(0);
    }
  });

  it("releases far slower than it arrives, so the hit reads as a hit", () => {
    expect(HERO_SURGE.releaseS).toBeGreaterThan(HERO_SURGE.attackS * 3);
  });

  it("has no step in it, which is what would read as a frame drop", () => {
    let previous = heroSurge(0);
    for (let t = 0.002; t <= HERO_SURGE_TOTAL_S; t += 0.002) {
      const value = heroSurge(t);
      expect(Math.abs(value - previous)).toBeLessThan(0.05);
      previous = value;
    }
  });

  it("finishes the inscription swap inside the surge it rides in", () => {
    expect(
      HERO_LABEL_SWAP.leadS + HERO_LABEL_SWAP.durationS,
    ).toBeLessThanOrEqual(HERO_SURGE_TOTAL_S);
  });
});
