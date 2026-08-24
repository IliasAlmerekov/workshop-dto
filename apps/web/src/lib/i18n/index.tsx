"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  applyLocale,
  loadLocale,
  saveLocale,
  setActiveLocale,
  type Locale,
} from "./locale";
import { en, type Messages } from "./en";
import { CATALOGUES } from "./catalogue";

export function messagesFor(locale: Locale): Messages {
  return CATALOGUES[locale];
}

type LocaleContextValue = {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Deferred like the theme's: `localStorage` is client-only, so the first
  // render has to match the statically exported English HTML before the
  // stored preference is applied.
  useEffect(() => {
    const stored = loadLocale();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocaleState(stored);
    setActiveLocale(stored);
    applyLocale(stored);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    setActiveLocale(next);
    applyLocale(next);
    saveLocale(next);
  }, []);

  // Kept in sync during render as well as in the effect: a validator called
  // from an event handler in the same commit must not read the previous
  // locale off the module.
  setActiveLocale(locale);

  const value = useMemo(
    () => ({ locale, messages: CATALOGUES[locale], setLocale }),
    [locale, setLocale],
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/**
 * Components rendered outside a provider fall back to English rather than
 * throwing: several are unit-tested in isolation, and a missing provider
 * should degrade to the source language, not to a blank screen.
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  const fallback = useMemo<LocaleContextValue>(
    () => ({ locale: "en", messages: en, setLocale: () => {} }),
    [],
  );
  return context ?? fallback;
}

export function useMessages(): Messages {
  return useLocale().messages;
}

export type { Messages };
