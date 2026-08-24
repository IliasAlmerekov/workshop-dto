export const LOCALES = ["en", "de"] as const;

export type Locale = (typeof LOCALES)[number];

export const LOCALE_STORAGE_KEY = "dto-mapper-workshop-locale";

/** What each locale calls itself — never translated. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  de: "Deutsch",
};

/** Two letters for the header's segmented control, where space is tight. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: "EN",
  de: "DE",
};

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value);
}

/**
 * English is the deliberate default. The workshop's own material — the code
 * samples, field names and every identifier a participant types — is English
 * regardless of locale, so an unset preference should not silently move the
 * prose away from it. The OS language is not consulted; only the switcher.
 */
export function loadLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
  return isLocale(stored) ? stored : "en";
}

export function saveLocale(locale: Locale) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

/**
 * Sets `<html lang>` before first paint, the same way the theme does. The
 * attribute drives hyphenation, spell-check and how a screen reader
 * pronounces the page, so it must be right in the very first frame rather
 * than corrected after hydration.
 */
export const LOCALE_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem("${LOCALE_STORAGE_KEY}");document.documentElement.lang=s==="de"?"de":"en";}catch(e){}})();`;

/**
 * The locale as plain module state, for the code that runs outside React.
 *
 * The Lezer validators are pure functions called from an event handler, deep
 * behind a language adapter that is built once at module load — threading a
 * locale through that chain would put a UI concern into four check modules
 * and sixteen adapters. One process renders one locale at a time, so a
 * module-level value read at call time is both correct and the smaller
 * change. `LocaleProvider` is the only writer.
 */
let activeLocale: Locale = "en";

export function setActiveLocale(locale: Locale) {
  activeLocale = locale;
}

export function getActiveLocale(): Locale {
  return activeLocale;
}
