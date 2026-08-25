import { describe, expect, it } from "vitest";
import { DTO_LAYERS } from "./dtoLayers";
import {
  CONNECTOR_NODE_TONES,
  TRACK_FOCUS_LAYER_INDEX,
  TRACK_PREVIEWS,
  TRACK_SNIPPET_MAX_CHARS,
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
