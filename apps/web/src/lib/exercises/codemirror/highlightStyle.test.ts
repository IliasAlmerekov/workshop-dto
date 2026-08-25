import { describe, expect, it } from "vitest";
import { tags } from "@lezer/highlight";
import { defaultHighlightStyle } from "@codemirror/language";
import { workshopHighlightStyle } from "./highlightStyle";

function ruleFor(tag: Parameters<typeof workshopHighlightStyle.style>[0][0]) {
  const className = workshopHighlightStyle.style([tag]);
  expect(className).toBeTruthy();
  const rules = workshopHighlightStyle.module?.getRules() ?? "";
  const selector = className!.split(" ").at(-1)!;
  return (
    rules
      .split("}")
      .map((block) => `${block}}`)
      .find((block) => block.includes(`.${selector}`)) ?? ""
  );
}

describe("workshopHighlightStyle", () => {
  // The point of the whole file: CodeMirror's default palette paints names
  // blue for a white page, which is unreadable on the dark theme's #131316.
  it("leaves the names a participant types on --code-foreground", () => {
    for (const tag of [
      tags.name,
      tags.variableName,
      tags.propertyName,
      tags.definition(tags.variableName),
      tags.function(tags.variableName),
    ]) {
      expect(ruleFor(tag)).toContain("var(--code-foreground)");
    }
  });

  it("does not inherit the default style's fixed blue for those tags", () => {
    for (const tag of [tags.variableName, tags.propertyName]) {
      expect(defaultHighlightStyle.style([tag])).not.toBe(
        workshopHighlightStyle.style([tag]),
      );
    }
  });

  // Colour is spent on what is *not* the participant's vocabulary, and every
  // one of those tokens is themeable rather than a baked-in hex.
  it("themes keywords, types, literals, comments and punctuation by token", () => {
    expect(ruleFor(tags.keyword)).toContain("var(--syntax-keyword)");
    expect(ruleFor(tags.typeName)).toContain("var(--syntax-type)");
    expect(ruleFor(tags.string)).toContain("var(--syntax-string)");
    expect(ruleFor(tags.number)).toContain("var(--syntax-string)");
    expect(ruleFor(tags.lineComment)).toContain("var(--syntax-comment)");
    expect(ruleFor(tags.punctuation)).toContain("var(--syntax-punct)");
  });
});
