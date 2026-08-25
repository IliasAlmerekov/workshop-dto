import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("workshopEditorTheme", () => {
  it("keeps typed text and CodeMirror's drawn cursor visible in dark mode", () => {
    const globalsCss = readFileSync(
      path.join(process.cwd(), "src/app/globals.css"),
      "utf-8",
    );
    const darkTheme =
      globalsCss.match(/:root\[data-theme="dark"\]\s*{[^}]*}/)?.[0] ?? "";
    const editorTheme = readFileSync(
      path.join(process.cwd(), "src/lib/exercises/codemirror/theme.ts"),
      "utf-8",
    );

    expect(darkTheme).toMatch(/--code-foreground:\s*#fafafa;/);
    expect(darkTheme).toMatch(/--code-caret:\s*#ffffff;/);
    expect(editorTheme).toContain('color: "var(--code-foreground)"');

    const focusedDarkCursorRule =
      globalsCss.match(
        /:root\[data-theme="dark"\]\s+\.cm-editor\.cm-focused\s*>\s*\.cm-scroller\s*>\s*\.cm-cursorLayer\s+\.cm-cursor\s*{[^}]*}/,
      )?.[0] ?? "";

    expect(focusedDarkCursorRule).toMatch(
      /border-left-color:\s*var\(--code-caret\);/,
    );
  });
});
