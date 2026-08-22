import type { Language } from "@/lib/workshop/types";
import type { TaskLanguageAdapter } from "./types";

const LOADERS: Record<Language, () => Promise<TaskLanguageAdapter>> = {
  typescript: async () =>
    (await import("./adapters/typescriptResponseMapper"))
      .typescriptResponseMapperAdapter,
  php: async () =>
    (await import("./adapters/phpResponseMapper")).phpResponseMapperAdapter,
  python: async () =>
    (await import("./adapters/pythonResponseMapper"))
      .pythonResponseMapperAdapter,
  java: async () =>
    (await import("./adapters/javaResponseMapper")).javaResponseMapperAdapter,
};

export function loadTask4Adapter(
  language: Language,
): Promise<TaskLanguageAdapter> {
  return LOADERS[language]();
}
