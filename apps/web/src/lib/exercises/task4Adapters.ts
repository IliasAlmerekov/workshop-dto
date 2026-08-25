import type { Language } from "@/lib/workshop/types";
import type { TaskLanguageAdapter } from "./types";
import { registrationAdapter } from "./registrationAdapters";

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
  return Promise.resolve(registrationAdapter("welcome-email-mapper", language));
}
