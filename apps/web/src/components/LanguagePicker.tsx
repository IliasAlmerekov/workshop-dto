"use client";

import { useRef } from "react";
import { LANGUAGES, type Language } from "@/lib/workshop/types";
import { LANGUAGE_LABELS } from "@/lib/workshop/languageLabels";
import { LanguageIcon } from "./LanguageIcon";

type LanguagePickerProps = {
  value: Language | null;
  onChange: (language: Language) => void;
};

const ARROW_STEP: Record<string, 1 | -1> = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
};

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const focusedIndex = value ? LANGUAGES.indexOf(value) : 0;

  function handleKeyDown(event: React.KeyboardEvent, index: number) {
    const step = ARROW_STEP[event.key];
    if (step === undefined) {
      return;
    }
    event.preventDefault();
    const nextIndex = (index + step + LANGUAGES.length) % LANGUAGES.length;
    onChange(LANGUAGES[nextIndex]);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Choose your programming language"
      className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
    >
      {LANGUAGES.map((language, index) => {
        const selected = value === language;
        return (
          <button
            key={language}
            ref={(node) => {
              buttonRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={index === focusedIndex ? 0 : -1}
            onClick={() => onChange(language)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border bg-[var(--surface)] px-4 py-7 text-base font-medium transition-all ${
              selected
                ? "border-[var(--accent)] shadow-[var(--shadow)]"
                : "border-[var(--border)] shadow-[var(--shadow-sm)] hover:border-[var(--muted)]"
            }`}
          >
            <LanguageIcon language={language} size={44} />
            <span className={selected ? "text-[var(--accent)]" : undefined}>
              {LANGUAGE_LABELS[language]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
