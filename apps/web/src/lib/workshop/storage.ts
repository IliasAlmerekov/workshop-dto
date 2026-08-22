import {
  LANGUAGES,
  TASK_IDS,
  type TaskProgress,
  type WorkshopState,
} from "./types";

export const STORAGE_KEY = "dto-mapper-workshop";
export const SCHEMA_VERSION = 2;

export function createDefaultState(): WorkshopState {
  return {
    version: SCHEMA_VERSION,
    language: null,
    tasks: Object.fromEntries(
      TASK_IDS.map((id) => [
        id,
        { completed: false, draft: "", touched: false, hintsUsed: 0 },
      ]),
    ) as WorkshopState["tasks"],
    quizCompleted: false,
  };
}

function isTaskProgress(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<TaskProgress>;
  return (
    typeof candidate.completed === "boolean" &&
    typeof candidate.draft === "string" &&
    typeof candidate.touched === "boolean" &&
    typeof candidate.hintsUsed === "number"
  );
}

/**
 * Validates the full shape, not just the version number: every task id must
 * be present with a well-formed TaskProgress, and language must be null or
 * one of the supported tracks. A version-matching but structurally wrong
 * value (e.g. from a manual edit, or a future field renamed without a schema
 * bump) must fail this check rather than crash the app later when code reads
 * a field that turns out to be missing.
 */
function isWorkshopState(value: unknown): value is WorkshopState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<WorkshopState>;

  if (typeof candidate.version !== "number") {
    return false;
  }
  if (
    candidate.language !== null &&
    !(LANGUAGES as readonly unknown[]).includes(candidate.language)
  ) {
    return false;
  }
  if (typeof candidate.quizCompleted !== "boolean") {
    return false;
  }

  const tasks = candidate.tasks;
  if (typeof tasks !== "object" || tasks === null) {
    return false;
  }

  return TASK_IDS.every((id) =>
    isTaskProgress((tasks as Record<string, unknown>)[id]),
  );
}

/**
 * Loads workshop state from localStorage. A missing, corrupt, or
 * version-mismatched entry resets to a fresh default state rather than
 * throwing, per spec section 10 ("inkompatible neue Workshop-Version setzt
 * nur den Workshopzustand zurück").
 */
export function loadState(): WorkshopState {
  if (typeof window === "undefined") {
    return createDefaultState();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isWorkshopState(parsed) || parsed.version !== SCHEMA_VERSION) {
      return createDefaultState();
    }

    return parsed;
  } catch {
    return createDefaultState();
  }
}

export function saveState(state: WorkshopState): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearState(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(STORAGE_KEY);
}
