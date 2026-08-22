import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodeEditor } from "./CodeEditor";

describe("CodeEditor", () => {
  it("the .code-layer rule does not wrap lines (regression: gutter/line desync)", () => {
    const globalsCssPath = path.join(process.cwd(), "src/app/globals.css");
    const css = readFileSync(globalsCssPath, "utf-8");
    const rule = css.match(/\.code-layer\s*{[^}]*}/)?.[0] ?? "";

    expect(rule).toMatch(/white-space:\s*pre;/);
    expect(rule).not.toMatch(/pre-wrap/);
  });

  it("does not wrap long lines, so the gutter's line numbers stay aligned with the textarea's logical lines", () => {
    const longLine =
      "public final class SomeVeryLongClassNameThatWouldOtherwiseWrapAcrossMultipleVisualRows {";
    render(
      <CodeEditor
        id="draft"
        label="Your solution"
        fileName="Example.java"
        language="java"
        value={`${longLine}\nsecond line\nthird line`}
        onChange={vi.fn()}
      />,
    );

    // The no-wrap rule itself lives in globals.css's .code-layer class (jsdom
    // doesn't load stylesheets in an isolated component test, and a textarea's
    // UA default is white-space: pre-wrap, which would make this assertion
    // pass for the wrong reason if checked via getComputedStyle here).
    const textarea = screen.getByLabelText("Your solution");
    expect(textarea).toHaveClass("code-layer");

    // One gutter number per logical line, matching value.split("\n").length.
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
