import type { Language } from "@/lib/workshop/types";
import type { TaskLanguageAdapter } from "./types";

/**
 * Each loader is a separate dynamic import, so CodeMirror's language
 * packages (and their Lezer grammars) only ever load for the track the
 * participant actually picked, not all four at once.
 */
const LOADERS: Record<Language, () => Promise<TaskLanguageAdapter>> = {
  typescript: async () =>
    (await import("./adapters/typescript")).typescriptAdapter,
  php: async () => (await import("./adapters/php")).phpAdapter,
  python: async () => (await import("./adapters/python")).pythonAdapter,
  java: async () => (await import("./adapters/java")).javaAdapter,
};

export function loadTask1Adapter(
  language: Language,
): Promise<TaskLanguageAdapter> {
  return LOADERS[language]();
}
