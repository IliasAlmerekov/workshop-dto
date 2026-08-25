"use client";

import { useId, useState } from "react";
import { LANGUAGES, type Language } from "@/lib/workshop/types";
import { LANGUAGE_LABELS } from "@/lib/workshop/languageLabels";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { useMessages } from "@/lib/i18n";
import { LanguageIcon } from "./LanguageIcon";
import { ConfirmDialog } from "./ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

/**
 * The track switcher.
 *
 * It was a native `<select>`, which meant the four tracks were four lines of
 * text — while the same four choices on the landing page are logo cards. A
 * listbox lets the header carry the same marks, so PHP is recognised by its
 * logo in both places instead of being read twice.
 *
 * The draft guard is unchanged: switching with unsaved work in the editor
 * asks first, and only clears the current task's draft.
 */
export function LanguageSwitcher() {
  const {
    state,
    activeTaskId,
    hasActiveDraft,
    selectLanguage,
    clearActiveDraft,
  } = useWorkshop();
  const messages = useMessages();
  const [pendingLanguage, setPendingLanguage] = useState<Language | null>(null);
  const labelId = useId();

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
    ? messages.tasks[activeTaskId].title
    : "";

  return (
    <div>
      <span id={labelId} className="sr-only">
        {messages.header.programmingLanguage}
      </span>

      {/* The checkmark trails the row: each item leads with its track logo,
          and a leading indicator would push those marks out of one column. */}
      <Select
        indicatorPosition="right"
        value={state.language ?? undefined}
        onValueChange={(next) => handleChange(next as Language)}
      >
        {/* No icon here: `SelectValue` renders the chosen item's own content,
            logo included, so drawing one alongside it showed the mark twice. */}
        <SelectTrigger aria-labelledby={labelId} className="w-[158px]">
          <SelectValue placeholder={messages.header.selectLanguage} />
        </SelectTrigger>

        <SelectContent align="end">
          {LANGUAGES.map((language) => (
            <SelectItem
              key={language}
              value={language}
              // The item's children are markup, so Radix needs the plain
              // string for typeahead and for the trigger's accessible name.
              textValue={LANGUAGE_LABELS[language]}
            >
              <span className="flex items-center gap-2.5 whitespace-nowrap">
                <LanguageIcon language={language} size={16} />
                {LANGUAGE_LABELS[language]}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ConfirmDialog
        open={pendingLanguage !== null}
        title={messages.header.switchTitle}
        description={messages.header.switchDescription(
          pendingLanguage ? LANGUAGE_LABELS[pendingLanguage] : "",
          activeTaskTitle,
        )}
        confirmLabel={messages.header.switchConfirm}
        cancelLabel={messages.header.switchCancel}
        onConfirm={confirmSwitch}
        onCancel={cancelSwitch}
      />
    </div>
  );
}
