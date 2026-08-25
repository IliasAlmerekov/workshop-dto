"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { EditorView } from "@codemirror/view";
import { restrictedEditing } from "@/lib/exercises/codemirror/restrictedEditing";
import { workshopEditorTheme } from "@/lib/exercises/codemirror/theme";
import { loadLanguageExtension } from "@/lib/exercises/codemirror/languageExtension";
import type { CompletionInput } from "@/lib/exercises/types";
import type { Language } from "@/lib/workshop/types";
import { useMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { LanguageIcon } from "./LanguageIcon";
import { IconButton } from "./ui/IconButton";
import { IconMaximize, IconX } from "./ui/icons";

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
  /** The task's input symbols; omitted for tasks that read no input. */
  completionInput?: CompletionInput;
  /**
   * Absorb the remaining height of a height-bound column instead of growing
   * with the document. The code area then scrolls inside its own frame, which
   * is what keeps the workshop page itself from ever scrolling.
   */
  fill?: boolean;
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
  completionInput,
  fill = false,
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
  const messages = useMessages();
  const [expanded, setExpanded] = useState(false);

  // Expanding covers the page, so Escape has to bring it back — a control that
  // takes over the viewport without an exit key traps keyboard users.
  useEffect(() => {
    if (!expanded) {
      return;
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setExpanded(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

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
        { EditorState, Prec },
        { basicSetup },
        { syntaxHighlighting },
        { workshopHighlightStyle },
        { workshopCompletion },
        languageExtension,
      ] = await Promise.all([
        import("@codemirror/view"),
        import("@codemirror/state"),
        import("codemirror"),
        import("@codemirror/language"),
        import("@/lib/exercises/codemirror/highlightStyle"),
        import("@/lib/exercises/codemirror/completion"),
        loadLanguageExtension(language),
      ]);

      if (cancelled || !hostRef.current) {
        return;
      }

      const doc = before + editable + after;
      const region = restrictedEditing(
        { from: before.length, to: before.length + editable.length },
        (text) => onEditableChangeRef.current(text),
      );
      const state = EditorState.create({
        doc,
        extensions: [
          // Outranks the `defaultHighlightStyle` `basicSetup` bundles, whose
          // white-page palette turns typed names blue on the dark theme.
          Prec.highest(syntaxHighlighting(workshopHighlightStyle)),
          basicSetup,
          languageExtension,
          workshopEditorTheme,
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ "aria-label": label }),
          region.extension,
          // After basicSetup on purpose: its bare autocompletion() sets no
          // config fields, so this one's override/activateOnTyping win
          // without a merge conflict.
          workshopCompletion(language, region, completionInput),
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
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--code-bg)]",
        expanded
          ? "fixed inset-16 z-50 shadow-popover"
          : fill && "min-h-[168px] flex-1",
      )}
    >
      {/* Tab bar (Figma `Code Editor`, 40:28): a recessed 49px strip, the
          active file on a raised surface behind a right-hand hairline, and the
          editor's own controls pushed to the far end. The library's theme
          toggle is intentionally absent — the theme belongs to the app bar,
          and a second control for it inside the editor would be a duplicate. */}
      <div className="flex h-[49px] shrink-0 items-center bg-[var(--surface-raised)] pr-22">
        <span className="flex h-full items-center gap-12 border-r border-[var(--border)] bg-[var(--surface)] pr-18 pl-[23px]">
          <LanguageIcon language={language} size={20} />
          <span className="text-body-small leading-body-small font-mono text-[var(--foreground)]">
            {fileName}
          </span>
        </span>
        <span className="flex-1" />
        <IconButton
          aria-label={
            expanded
              ? messages.exercise.collapseEditor
              : messages.exercise.expandEditor
          }
          onClick={() => setExpanded((value) => !value)}
          className="size-[34px]"
        >
          {expanded ? <IconX size={19} /> : <IconMaximize size={19} />}
        </IconButton>
      </div>
      <div
        aria-label={label}
        role="group"
        ref={hostRef}
        className={cn(
          expanded || fill ? "min-h-0 flex-1 overflow-auto" : undefined,
          // CodeMirror sizes itself to its content; in a filled frame the
          // scroller has to take the frame's height instead.
          (expanded || fill) &&
            "[&_.cm-editor]:h-full [&_.cm-scroller]:overflow-auto",
        )}
      />
      {!ready && (
        <p role="status" className="p-16 text-body-small text-[var(--muted)]">
          {messages.common.loading}
        </p>
      )}
    </div>
  );
}
