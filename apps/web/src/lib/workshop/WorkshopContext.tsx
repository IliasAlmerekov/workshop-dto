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
  TASK_IDS,
  type Language,
  type TaskId,
  type WorkshopState,
} from "./types";
import {
  createDefaultState,
  loadState,
  saveState,
  clearState,
} from "./storage";
import { starterCode } from "./starterCode";
import { TASK1_STARTER_CODE } from "@/lib/exercises/task1StarterCode";
import { TASK2_STARTER_CODE } from "@/lib/exercises/task2StarterCode";

/**
 * The real CodeMirror runner (tasks with a Lezer-based adapter) persists
 * only the editable TODO region — the surrounding file is fixed,
 * per-language boilerplate re-derived from the adapter, not something to
 * store per participant. Every other task still uses the older placeholder
 * flow, which persists the whole draft.
 */
const REAL_TASK_STARTER_CODE: Partial<
  Record<TaskId, Record<Language, { editable: string }>>
> = {
  "request-dto": TASK1_STARTER_CODE,
  "request-mapper": TASK2_STARTER_CODE,
};

function untouchedStarterText(taskId: TaskId, language: Language): string {
  const real = REAL_TASK_STARTER_CODE[taskId];
  return real ? real[language].editable : starterCode(taskId, language);
}

type WorkshopContextValue = {
  state: WorkshopState;
  hydrated: boolean;
  activeTaskId: TaskId | null;
  hasActiveDraft: boolean;
  selectLanguage: (language: Language) => void;
  clearActiveDraft: () => void;
  updateDraft: (taskId: TaskId, draft: string) => void;
  /** Records that one more progressive hint (spec 7.3) has been revealed for this task. */
  recordHintUsed: (taskId: TaskId) => void;
  completeTask: (taskId: TaskId) => void;
  resetWorkshop: () => void;
};

const WorkshopContext = createContext<WorkshopContextValue | null>(null);

function firstIncompleteTaskId(state: WorkshopState): TaskId | null {
  return TASK_IDS.find((id) => !state.tasks[id].completed) ?? null;
}

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkshopState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Deferred on purpose: localStorage is a client-only external system, so
    // the first render must match the static-export server HTML (default
    // state) before we sync in the persisted state to avoid a hydration
    // mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) {
      saveState(state);
    }
  }, [state, hydrated]);

  const selectLanguage = useCallback((language: Language) => {
    setState((previous) => ({ ...previous, language }));
  }, []);

  const activeTaskId = useMemo(() => firstIncompleteTaskId(state), [state]);

  // Untouched starter code is not "work in progress", so switching language
  // while the editor is still pristine must not prompt for confirmation.
  const hasActiveDraft = useMemo(() => {
    if (!activeTaskId || !state.language) {
      return false;
    }
    const { draft, touched } = state.tasks[activeTaskId];
    return (
      touched && draft !== untouchedStarterText(activeTaskId, state.language)
    );
  }, [activeTaskId, state]);

  const clearActiveDraft = useCallback(() => {
    setState((previous) => {
      const taskId = firstIncompleteTaskId(previous);
      if (!taskId) {
        return previous;
      }
      return {
        ...previous,
        tasks: {
          ...previous.tasks,
          [taskId]: { ...previous.tasks[taskId], draft: "", touched: false },
        },
      };
    });
  }, []);

  const updateDraft = useCallback((taskId: TaskId, draft: string) => {
    setState((previous) => ({
      ...previous,
      tasks: {
        ...previous.tasks,
        [taskId]: { ...previous.tasks[taskId], draft, touched: true },
      },
    }));
  }, []);

  const recordHintUsed = useCallback((taskId: TaskId) => {
    setState((previous) => ({
      ...previous,
      tasks: {
        ...previous.tasks,
        [taskId]: {
          ...previous.tasks[taskId],
          hintsUsed: previous.tasks[taskId].hintsUsed + 1,
        },
      },
    }));
  }, []);

  const completeTask = useCallback((taskId: TaskId) => {
    setState((previous) => ({
      ...previous,
      tasks: {
        ...previous.tasks,
        [taskId]: { ...previous.tasks[taskId], completed: true },
      },
    }));
  }, []);

  const resetWorkshop = useCallback(() => {
    clearState();
    setState(createDefaultState());
  }, []);

  const value = useMemo<WorkshopContextValue>(
    () => ({
      state,
      hydrated,
      activeTaskId,
      hasActiveDraft,
      selectLanguage,
      clearActiveDraft,
      updateDraft,
      recordHintUsed,
      completeTask,
      resetWorkshop,
    }),
    [
      state,
      hydrated,
      activeTaskId,
      hasActiveDraft,
      selectLanguage,
      clearActiveDraft,
      updateDraft,
      recordHintUsed,
      completeTask,
      resetWorkshop,
    ],
  );

  return (
    <WorkshopContext.Provider value={value}>
      {children}
    </WorkshopContext.Provider>
  );
}

export function useWorkshop(): WorkshopContextValue {
  const context = useContext(WorkshopContext);
  if (!context) {
    throw new Error("useWorkshop must be used within a WorkshopProvider");
  }
  return context;
}
