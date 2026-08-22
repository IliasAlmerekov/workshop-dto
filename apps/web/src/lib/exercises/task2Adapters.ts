import type { Language } from "@/lib/workshop/types";
import type { TaskLanguageAdapter } from "./types";

const LOADERS: Record<Language, () => Promise<TaskLanguageAdapter>> = {
  typescript: async () =>
    (await import("./adapters/typescriptMapper")).typescriptMapperAdapter,
  php: async () => (await import("./adapters/phpMapper")).phpMapperAdapter,
  python: async () =>
    (await import("./adapters/pythonMapper")).pythonMapperAdapter,
  java: async () => (await import("./adapters/javaMapper")).javaMapperAdapter,
};

export function loadTask2Adapter(
  language: Language,
): Promise<TaskLanguageAdapter> {
  return LOADERS[language]();
}
