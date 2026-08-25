import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

/**
 * DESIGN.md, `tokens.json` and `theme.css` are one source in three formats,
 * and the validation pair is the part of it a component is most tempted to
 * hardcode. These assertions pin the two decisions the result panel rests on:
 * failure is Signal Red `#ff2001`, and passing is Accent Blue — there is no
 * green in this system.
 */
const ROOT = path.join(process.cwd(), "..", "..");

function read(file: string) {
  return readFileSync(path.join(ROOT, file), "utf-8");
}

const themeCss = read("theme.css");
const tokensJson = read("tokens.json");
const designMd = read("DESIGN.md");
const globalsCss = readFileSync(
  path.join(process.cwd(), "src/app/globals.css"),
  "utf-8",
);

describe("validation status tokens", () => {
  it("uses Signal Red #ff2001 as the failure primitive", () => {
    expect(themeCss).toMatch(/--color-red-600:\s*#ff2001;/);
    expect(tokensJson).toContain('"$value": "#ff2001"');
    expect(designMd).toContain("`#ff2001`");
  });

  // The verdict is small text on a light surface; #ff2001 is 3.85:1 there, so
  // the text binding steps one value darker while every fill and glyph keeps
  // the signal value itself.
  it("keeps the light-theme failure text on the AA-safe sibling of the same hue", () => {
    expect(themeCss).toMatch(
      /--color-status-danger:\s*var\(--color-red-700\);/,
    );
    expect(themeCss).toMatch(
      /--color-status-danger-solid:\s*var\(--color-red-600\);/,
    );
  });

  it("carries the signal value itself on the dark theme, where it clears AA", () => {
    const dark =
      globalsCss.match(/:root\[data-theme="dark"\]\s*{[^}]*}/)?.[0] ?? "";
    expect(dark).toMatch(/--danger:\s*#ff2001;/);
    expect(dark).toMatch(/--danger-solid:\s*#ff2001;/);
  });

  it("resolves passing to Accent Blue and keeps green out of the palette", () => {
    expect(themeCss).toMatch(
      /--color-status-success:\s*var\(--color-blue-600\);/,
    );
    expect(themeCss).not.toMatch(/--color-green-/);
    expect(tokensJson).not.toContain('"green"');
  });
});
