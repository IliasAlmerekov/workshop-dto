import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@/lib/workshop/types";
import { DTO_LAYERS, LABEL_FIT_WIDTH, fittedLabelSize } from "./dtoLayers";
import { DECLARED_LAYER_IDS, trackDeclaration } from "./trackDeclarations";

describe("track declarations", () => {
  it("renames only the two boundaries a language decides", () => {
    expect(DECLARED_LAYER_IDS).toEqual(["request-dto", "response-dto"]);
  });

  it("gives every track a declaration for both of them", () => {
    for (const language of LANGUAGES) {
      for (const id of DECLARED_LAYER_IDS) {
        expect(
          trackDeclaration(language, id),
          `${language}/${id}`,
        ).toBeTruthy();
      }
    }
  });

  it("leaves the mapper and the entity with their role names in every track", () => {
    for (const language of LANGUAGES) {
      expect(trackDeclaration(language, "mapper")).toBeNull();
      expect(trackDeclaration(language, "entity")).toBeNull();
    }
  });

  it("has nothing to show before a track is committed", () => {
    for (const layer of DTO_LAYERS) {
      expect(trackDeclaration(null, layer.id)).toBeNull();
    }
  });

  it("never shows two tracks the same answer", () => {
    for (const id of DECLARED_LAYER_IDS) {
      const shown = LANGUAGES.map((language) => trackDeclaration(language, id));
      expect(new Set(shown).size).toBe(LANGUAGES.length);
    }
  });

  it("fits every declaration inside the slab it is pressed into", () => {
    for (const language of LANGUAGES) {
      for (const id of DECLARED_LAYER_IDS) {
        const text = trackDeclaration(language, id);
        const layer = DTO_LAYERS.find((entry) => entry.id === id);
        if (!text || !layer) {
          throw new Error(`missing ${language}/${id}`);
        }
        const size = fittedLabelSize(text, layer.labelSize * 0.88);
        expect(size).toBeGreaterThan(0);
        expect(text.length * 0.55 * size).toBeLessThanOrEqual(
          LABEL_FIT_WIDTH + 1e-9,
        );
      }
    }
  });

  it("never sizes a label up past what the composition authored", () => {
    expect(fittedLabelSize("Mapper", 0.275)).toBe(0.275);
    expect(fittedLabelSize("", 0.3)).toBe(0.3);
  });
});
