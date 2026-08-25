"use client";

import { useLocale } from "@/lib/i18n";
import { LOCALES, LOCALE_LABELS, LOCALE_SHORT } from "@/lib/i18n/locale";

/**
 * Two locales, both always visible: a segmented control rather than a
 * dropdown, so switching costs one click and the alternative is legible
 * before you commit to it. Each option carries the language's own name as
 * its accessible label — `Deutsch`, never "German" — which is what a reader
 * looking for their language actually scans for.
 *
 * The programming-language select sits beside this in the header, so the two
 * must not look alike: this is a compact pill of two letters, that one is a
 * bordered select with an icon.
 */
export function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, messages, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label={messages.locale.groupLabel}
      className={`flex items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-0.5 ${
        className ?? ""
      }`}
    >
      {LOCALES.map((option) => {
        const active = option === locale;
        return (
          <button
            key={option}
            type="button"
            lang={option}
            onClick={() => setLocale(option)}
            aria-pressed={active}
            title={LOCALE_LABELS[option]}
            className={`min-w-[34px] cursor-pointer rounded-[6px] px-2 py-1 text-[11px] font-semibold tracking-[0.06em] transition-colors duration-150 motion-reduce:transition-none ${
              active
                ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {LOCALE_SHORT[option]}
            <span className="sr-only"> — {LOCALE_LABELS[option]}</span>
          </button>
        );
      })}
    </div>
  );
}
