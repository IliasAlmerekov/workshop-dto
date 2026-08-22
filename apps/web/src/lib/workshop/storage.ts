import { TASK_IDS, type WorkshopState } from "./types";

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

function isWorkshopState(value: unknown): value is WorkshopState {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const candidate = value as Partial<WorkshopState>;
  return (
    typeof candidate.version === "number" &&
    typeof candidate.tasks === "object" &&
    candidate.tasks !== null
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
