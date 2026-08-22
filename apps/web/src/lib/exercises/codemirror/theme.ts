import { EditorView } from "@codemirror/view";

/** Matches the app's design tokens (globals.css) instead of a CodeMirror preset theme. */
export const workshopEditorTheme = EditorView.theme({
  "&": {
    fontSize: "13px",
    backgroundColor: "var(--code-bg)",
    color: "var(--foreground)",
  },
  ".cm-content": {
    fontFamily:
      "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace",
    caretColor: "var(--accent)",
    padding: "14px 0",
  },
  ".cm-gutters": {
    backgroundColor: "var(--code-bg)",
    color: "var(--muted)",
    border: "none",
  },
  ".cm-activeLine": { backgroundColor: "transparent" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
  "&.cm-focused": { outline: "none" },
  ".cm-readonly-region": {
    color: "var(--muted)",
    opacity: 0.75,
  },
});
