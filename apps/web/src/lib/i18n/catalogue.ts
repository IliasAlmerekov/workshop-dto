import { en, type Messages } from "./en";
import { de } from "./de";
import { getActiveLocale, type Locale } from "./locale";

export const CATALOGUES: Record<Locale, Messages> = { en, de };

/**
 * The active catalogue for code that runs outside React — the Lezer
 * validators. See `setActiveLocale` for why the locale is module state
 * rather than an argument threaded through every adapter.
 */
export function activeMessages(): Messages {
  return CATALOGUES[getActiveLocale()];
}
