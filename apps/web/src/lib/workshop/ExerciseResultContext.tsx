"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import type { ValidationResult } from "@/lib/exercises/types";
import type { CheckRunProgress } from "./checkRun";
import type { TaskId } from "./types";

/**
 * The last check the participant ran, shared between the exercise column and
 * the result column beside it.
 *
 * Deliberately *not* part of `WorkshopContext`: that state is persisted under
 * a versioned storage key, and a check result is a property of the current
 * keystroke, not of the participant's progress. Reloading the page should
 * bring back the draft, not a stale verdict about it.
 */
export type PublishedResult = {
  taskId: TaskId;
  /**
   * `null` while a staged run is still playing: the verdict exists already,
   * but the column must not show it before the stages finish, and a partial
   * verdict is worse than none.
   */
  result: ValidationResult | null;
  /** Shown beside the verdict once every check passes. */
  explanation?: string;
  /** Set while `Check solution`'s stage list is still running. */
  run?: CheckRunProgress | null;
};

type ExerciseResultContextValue = {
  published: PublishedResult | null;
  publish: (value: PublishedResult | null) => void;
};

const ExerciseResultContext = createContext<ExerciseResultContextValue | null>(
  null,
);

export function ExerciseResultProvider({ children }: { children: ReactNode }) {
  const [published, setPublished] = useState<PublishedResult | null>(null);
  const publish = useCallback(
    (value: PublishedResult | null) => setPublished(value),
    [],
  );
  const value = useMemo(() => ({ published, publish }), [published, publish]);

  return (
    <ExerciseResultContext.Provider value={value}>
      {children}
    </ExerciseResultContext.Provider>
  );
}

/**
 * Readers outside a provider get `null` rather than an exception: the runner
 * is also rendered in tests and on surfaces that have no result column, and
 * the check flow must not depend on one being mounted.
 */
export function useExerciseResult(taskId: TaskId): PublishedResult | null {
  const context = useContext(ExerciseResultContext);
  const published = context?.published;
  return published && published.taskId === taskId ? published : null;
}

/**
 * Whether a result column is mounted to receive the verdict. The exercise
 * card falls back to rendering its own feedback when nothing else will show
 * it, so the check never reports into the void — and never twice.
 */
export function useHasResultSurface(): boolean {
  return useContext(ExerciseResultContext) !== null;
}

export function usePublishExerciseResult(): (
  value: PublishedResult | null,
) => void {
  const context = useContext(ExerciseResultContext);
  const noop = useCallback(() => {}, []);
  return context?.publish ?? noop;
}
