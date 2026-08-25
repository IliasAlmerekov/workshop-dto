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
import { type Language, type TaskId, type WorkshopState } from "./types";
import {
  createDefaultState,
  loadState,
  saveState,
  clearState,
} from "./storage";
import { starterCode } from "./starterCode";
import { isTaskOpen, firstIncompleteTaskId } from "./tasks";
import { TASK1_STARTER_CODE } from "@/lib/exercises/task1StarterCode";
import { TASK2_STARTER_CODE } from "@/lib/exercises/task2StarterCode";
import { TASK3_STARTER_CODE } from "@/lib/exercises/task3StarterCode";
import { TASK4_STARTER_CODE } from "@/lib/exercises/task4StarterCode";

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
  "external-api": TASK3_STARTER_CODE,
  "response-dto": TASK4_STARTER_CODE,
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
  /**
   * Moves the active task to an open one — a task the participant has already
   * completed, or the next incomplete task. Locked tasks are ignored, so the
   * participant can revisit earlier steps but never skip ahead (spec 16.1).
   */
  selectTask: (taskId: TaskId) => void;
  clearActiveDraft: () => void;
  updateDraft: (taskId: TaskId, draft: string) => void;
  /** Records that one more progressive hint (spec 7.3) has been revealed for this task. */
  recordHintUsed: (taskId: TaskId) => void;
  completeTask: (taskId: TaskId) => void;
  /** Marks the post-exercise knowledge check as done (spec 7.5/10). */
  completeQuiz: () => void;
  resetWorkshop: () => void;
};

const WorkshopContext = createContext<WorkshopContextValue | null>(null);

export function WorkshopProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorkshopState>(createDefaultState);
  const [hydrated, setHydrated] = useState(false);
  // Which task the participant is looking at. Null means "the first
  // incomplete task", which is how the workshop advances on its own; a value
  // here is a deliberate revisit of an open (completed or next) task and is
  // never persisted — reloads land back on the next thing to do.
  const [selectedTaskId, setSelectedTaskId] = useState<TaskId | null>(null);

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

  const activeTaskId = useMemo(() => {
    // A deliberate revisit wins while it still points at an open task; any
    // other state (a reset, completing it, or the selected task becoming
    // locked) falls back to the next incomplete task.
    if (selectedTaskId && isTaskOpen(state.tasks, selectedTaskId)) {
      return selectedTaskId;
    }
    return firstIncompleteTaskId(state.tasks);
  }, [selectedTaskId, state]);

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

  const selectTask = useCallback(
    (taskId: TaskId) => {
      if (!isTaskOpen(state.tasks, taskId)) {
        return;
      }
      setSelectedTaskId(taskId);
    },
    [state],
  );

  const clearActiveDraft = useCallback(() => {
    setState((previous) => {
      const taskId = firstIncompleteTaskId(previous.tasks);
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
          // Clamped here, not just by the caller-side stage guards in
          // ExerciseRunner: two recordHintUsed calls dispatched before a
          // re-render lets the caller re-observe the incremented count
          // (e.g. a fast double click on "Show hint") would otherwise push
          // hintsUsed past the 4 stages spec 7.3 defines.
          hintsUsed: Math.min(previous.tasks[taskId].hintsUsed + 1, 4),
        },
      },
    }));
  }, []);

  const completeTask = useCallback((taskId: TaskId) => {
    // Completing a task dismisses any manual revisit, so the workshop moves on
    // to the next incomplete task instead of lingering on the one just passed.
    setSelectedTaskId((selected) => (selected === taskId ? null : selected));
    setState((previous) => ({
      ...previous,
      tasks: {
        ...previous.tasks,
        [taskId]: { ...previous.tasks[taskId], completed: true },
      },
    }));
  }, []);

  const completeQuiz = useCallback(() => {
    setState((previous) => ({ ...previous, quizCompleted: true }));
  }, []);

  const resetWorkshop = useCallback(() => {
    clearState();
    setSelectedTaskId(null);
    setState(createDefaultState());
  }, []);

  const value = useMemo<WorkshopContextValue>(
    () => ({
      state,
      hydrated,
      activeTaskId,
      hasActiveDraft,
      selectLanguage,
      selectTask,
      clearActiveDraft,
      updateDraft,
      recordHintUsed,
      completeTask,
      completeQuiz,
      resetWorkshop,
    }),
    [
      state,
      hydrated,
      activeTaskId,
      hasActiveDraft,
      selectLanguage,
      selectTask,
      clearActiveDraft,
      updateDraft,
      recordHintUsed,
      completeTask,
      completeQuiz,
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
