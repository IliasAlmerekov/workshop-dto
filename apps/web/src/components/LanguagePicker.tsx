"use client";

import { LANGUAGES, type Language } from "@/lib/workshop/types";
import { LANGUAGE_LABELS } from "@/lib/workshop/languageLabels";
import { LanguageIcon } from "./LanguageIcon";

type LanguagePickerProps = {
  value: Language | null;
  onChange: (language: Language) => void;
};

export function LanguagePicker({ value, onChange }: LanguagePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Choose your programming language"
      className="grid max-w-2xl grid-cols-2 gap-4 sm:grid-cols-4"
    >
      {LANGUAGES.map((language) => {
        const selected = value === language;
        return (
          <button
            key={language}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(language)}
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
