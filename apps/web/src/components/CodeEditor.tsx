"use client";

import { useRef } from "react";
import { tokenize, TOKEN_COLORS } from "@/lib/workshop/highlight";
import { LanguageIcon } from "./LanguageIcon";
import type { Language } from "@/lib/workshop/types";

type CodeEditorProps = {
  id: string;
  label: string;
  fileName: string;
  language: Language;
  value: string;
  onChange: (value: string) => void;
};

export function CodeEditor({
  id,
  label,
  fileName,
  language,
  value,
  onChange,
}: CodeEditorProps) {
  const highlightRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lines = value.split("\n");
  const lineCount = Math.max(lines.length, 5);
  const tokens = tokenize(value);

  function syncScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    const { scrollTop, scrollLeft } = event.currentTarget;
    if (highlightRef.current) {
      highlightRef.current.scrollTop = scrollTop;
      highlightRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--code-bg)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] px-3 py-2">
        <span className="flex items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5">
          <LanguageIcon language={language} size={14} />
          <span className="font-mono text-xs">{fileName}</span>
        </span>
      </div>

      <div className="relative flex">
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="code-layer shrink-0 overflow-hidden border-r border-[var(--border)] pr-3 pl-4 text-right text-[var(--muted)] select-none"
        >
          {Array.from({ length: lineCount }, (_, index) => (
            <div key={index}>{index + 1}</div>
          ))}
        </div>

        <div className="relative flex-1">
          <pre
            ref={highlightRef}
            aria-hidden="true"
            className="code-layer pointer-events-none absolute inset-0 overflow-hidden"
          >
            {tokens.map((token, index) => (
              <span key={index} style={{ color: TOKEN_COLORS[token.kind] }}>
                {token.text}
              </span>
            ))}
            {"\n"}
          </pre>

          <label htmlFor={id} className="sr-only">
            {label}
          </label>
          <textarea
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onScroll={syncScroll}
            spellCheck={false}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            rows={lineCount}
            className="code-layer relative w-full resize-none bg-transparent text-transparent caret-[var(--accent)] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
