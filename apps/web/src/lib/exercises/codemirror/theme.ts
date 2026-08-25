import { EditorView } from "@codemirror/view";

/**
 * Matches the app's design tokens (globals.css) instead of a CodeMirror preset
 * theme, and reproduces the Figma `Code Editor` body (40:56): a 54px recessed
 * gutter with right-aligned `Code/Gutter` numerals at a 19px inset, and the
 * code itself in `Code/Editor` at a 26px line pitch from a 17px left inset.
 */
export const workshopEditorTheme = EditorView.theme({
  "&": {
    fontSize: "var(--text-code-editor)",
    backgroundColor: "var(--code-bg)",
    color: "var(--code-foreground)",
  },
  ".cm-content": {
    fontFamily: "var(--font-mono)",
    caretColor: "var(--code-caret)",
    lineHeight: "var(--leading-code-editor)",
    padding: "10px 0",
  },
  ".cm-line": { paddingLeft: "17px", paddingRight: "17px" },
  ".cm-gutters": {
    minWidth: "54px",
    backgroundColor: "var(--surface-raised)",
    color: "var(--color-code-linenumber)",
    border: "none",
    fontSize: "var(--text-code-gutter)",
    lineHeight: "var(--leading-code-editor)",
  },
  ".cm-lineNumbers .cm-gutterElement": {
    minWidth: "0",
    padding: "0 19px 0 0",
  },
  ".cm-activeLine": { backgroundColor: "transparent" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
  ".cm-readonly-region": {
    color: "var(--muted)",
    opacity: 0.75,
  },
});
