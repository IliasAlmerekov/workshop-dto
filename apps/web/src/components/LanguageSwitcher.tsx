"use client";

import { useId, useState } from "react";
import { LANGUAGES, type Language } from "@/lib/workshop/types";
import { LANGUAGE_LABELS } from "@/lib/workshop/languageLabels";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { taskDefinition } from "@/lib/workshop/tasks";
import { LanguageIcon } from "./LanguageIcon";
import { ConfirmDialog } from "./ConfirmDialog";

export function LanguageSwitcher() {
  const {
    state,
    activeTaskId,
    hasActiveDraft,
    selectLanguage,
    clearActiveDraft,
  } = useWorkshop();
  const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null);
  const selectId = useId();

  function handleChange(next: Language) {
    if (next === state.language) {
      return;
    }
    if (hasActiveDraft) {
      setPendingLanguage(next);
      return;
    }
    selectLanguage(next);
  }

  function confirmSwitch() {
    if (pendingLanguage) {
      clearActiveDraft();
      selectLanguage(pendingLanguage);
    }
    setPendingLanguage(null);
  }

  function cancelSwitch() {
    setPendingLanguage(null);
  }

  const activeTaskTitle = activeTaskId
    ? taskDefinition(activeTaskId).title
    : "";

  return (
    <div>
      <label htmlFor={selectId} className="sr-only">
        Programming language
      </label>
      <div className="relative flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2">
        {state.language && <LanguageIcon language={state.language} size={16} />}
        <select
          id={selectId}
          value={state.language ?? ""}
          onChange={(event) => handleChange(event.target.value as Language)}
          className="appearance-none bg-transparent pr-5 text-sm font-medium focus:outline-none"
        >
          {!state.language && <option value="">Select language</option>}
          {LANGUAGES.map((language) => (
            <option key={language} value={language}>
              {LANGUAGE_LABELS[language]}
            </option>
          ))}
        </select>
        <svg
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          aria-hidden="true"
          className="pointer-events-none absolute right-3 text-[var(--muted)]"
        >
          <path
            d="m6 9 6 6 6-6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <ConfirmDialog
        open={pendingLanguage !== null}
        title="Switch language?"
        description={`Switching to ${
          pendingLanguage ? LANGUAGE_LABELS[pendingLanguage] : ""
        } will clear your current draft for "${activeTaskTitle}". Completed tasks stay completed.`}
        confirmLabel="Switch and clear draft"
        cancelLabel="Keep current draft"
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
      />
    </div>
  );
}
