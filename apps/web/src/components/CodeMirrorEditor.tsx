"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import { restrictedEditing } from "@/lib/exercises/codemirror/restrictedEditing";
import { workshopEditorTheme } from "@/lib/exercises/codemirror/theme";
import { loadLanguageExtension } from "@/lib/exercises/codemirror/languageExtension";
import type { Language } from "@/lib/workshop/types";
import { LanguageIcon } from "./LanguageIcon";

type CodeMirrorEditorProps = {
  language: Language;
  fileName: string;
  before: string;
  editable: string;
  after: string;
  /** Changing this remounts the editor with fresh content (new task, language switch, insert solution). */
  resetKey: string;
  onEditableChange: (text: string) => void;
  label: string;
};

export function CodeMirrorEditor({
  language,
  fileName,
  before,
  editable,
  after,
  resetKey,
  onEditableChange,
  label,
}: CodeMirrorEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onEditableChangeRef = useRef(onEditableChange);
  // Keeps the mount effect below from needing onEditableChange in its deps
  // (which would tear the editor down and rebuild it on every keystroke,
  // since the callback is a fresh closure each render).
  useLayoutEffect(() => {
    onEditableChangeRef.current = onEditableChange;
  });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Deferred on purpose: dropping back to "loading" while the async
    // CodeMirror/language bundle for the new language/task arrives is the
    // whole point of this effect — there's no way to derive it at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(false);

    async function mount() {
      const [
        { EditorView },
        { EditorState },
        { basicSetup },
        languageExtension,
      ] = await Promise.all([
        import("@codemirror/view"),
        import("@codemirror/state"),
        import("codemirror"),
        loadLanguageExtension(language),
      ]);

      if (cancelled || !hostRef.current) {
        return;
      }

      const doc = before + editable + after;
      const state = EditorState.create({
        doc,
        extensions: [
          basicSetup,
          languageExtension,
          workshopEditorTheme,
          EditorView.lineWrapping,
          restrictedEditing(
            { from: before.length, to: before.length + editable.length },
            (text) => onEditableChangeRef.current(text),
          ),
        ],
      });

      viewRef.current?.destroy();
      viewRef.current = new EditorView({ state, parent: hostRef.current });
      setReady(true);
    }

    void mount();

    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
    };
    // `before`/`editable`/`after` are only read at mount time — a content
    // change without a resetKey bump would be this same keystroke's own
    // onEditableChange echoing back, which must not tear the editor down.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, resetKey]);

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--code-bg)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <span className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5">
          <LanguageIcon language={language} size={14} />
          <span className="font-mono text-xs">{fileName}</span>
        </span>
      </div>
      <div aria-label={label} role="group" ref={hostRef} className="text-sm" />
      {!ready && (
        <p className="p-4 text-sm text-[var(--muted)]">Loading editor…</p>
      )}
    </div>
  );
}
