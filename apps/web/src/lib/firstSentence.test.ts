import { describe, expect, it } from "vitest";
import { firstSentence } from "./firstSentence";

describe("firstSentence", () => {
  it("extracts the first sentence from multi-sentence text", () => {
    expect(firstSentence("First one. Second one.")).toBe("First one.");
  });

  it("returns single-sentence text with a period unchanged, not double-punctuated", () => {
    expect(firstSentence("Only one sentence here.")).toBe(
      "Only one sentence here.",
    );
  });

  it("returns text without any period unchanged", () => {
    expect(firstSentence("No terminal punctuation")).toBe(
      "No terminal punctuation",
    );
  });

  it("returns an empty string for empty input", () => {
    expect(firstSentence("")).toBe("");
  });
});
