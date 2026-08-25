import type { Language } from "@/lib/workshop/types";
import type { TaskLanguageAdapter } from "./types";
import { registrationAdapter } from "./registrationAdapters";
export function loadTask6Adapter(
  language: Language,
): Promise<TaskLanguageAdapter> {
  return Promise.resolve(
    registrationAdapter("registration-response-mapper", language),
  );
}
