import type { Language } from "@/lib/workshop/types";
import type { TaskLanguageAdapter } from "./types";
import { registrationAdapter } from "./registrationAdapters";

const LOADERS: Record<Language, () => Promise<TaskLanguageAdapter>> = {
  typescript: async () =>
    (await import("./adapters/typescriptIdentityMapper"))
      .typescriptIdentityMapperAdapter,
  php: async () =>
    (await import("./adapters/phpIdentityMapper")).phpIdentityMapperAdapter,
  python: async () =>
    (await import("./adapters/pythonIdentityMapper"))
      .pythonIdentityMapperAdapter,
  java: async () =>
    (await import("./adapters/javaIdentityMapper")).javaIdentityMapperAdapter,
};

export function loadTask3Adapter(
  language: Language,
): Promise<TaskLanguageAdapter> {
  return Promise.resolve(registrationAdapter("welcome-email-dto", language));
}
