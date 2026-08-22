"use client";

import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { taskDefinition } from "@/lib/workshop/tasks";
import { TASK1_DEFINITION } from "@/lib/exercises/task1";
import { TASK2_DEFINITION } from "@/lib/exercises/task2";
import { TASK3_DEFINITION } from "@/lib/exercises/task3";
import { TASK4_DEFINITION } from "@/lib/exercises/task4";
import { loadTask1Adapter } from "@/lib/exercises/task1Adapters";
import { loadTask2Adapter } from "@/lib/exercises/task2Adapters";
import { loadTask3Adapter } from "@/lib/exercises/task3Adapters";
import { loadTask4Adapter } from "@/lib/exercises/task4Adapters";
import type { TaskDefinition } from "@/lib/exercises/types";
import type { TaskLanguageAdapter } from "@/lib/exercises/types";
import type { Language, TaskId } from "@/lib/workshop/types";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseRunner } from "./ExerciseRunner";
import { EntityDtoComparisonPanel } from "./EntityDtoComparisonPanel";
import type { ReactNode } from "react";

/**
 * All four tasks have graduated to the real CodeMirror + Lezer-validated
 * runner (issue #4, extended in issues #5, #6, and #7). `ExerciseCard`
 * stays as a fallback for any task without an entry here.
 */
const REAL_TASKS: Partial<
  Record<
    TaskId,
    {
      definition: TaskDefinition;
      loadAdapter: (language: Language) => Promise<TaskLanguageAdapter>;
      successPanel?: ReactNode;
    }
  >
> = {
  "request-dto": {
    definition: TASK1_DEFINITION,
    loadAdapter: loadTask1Adapter,
  },
  "request-mapper": {
    definition: TASK2_DEFINITION,
    loadAdapter: loadTask2Adapter,
  },
  "external-api": {
    definition: TASK3_DEFINITION,
    loadAdapter: loadTask3Adapter,
  },
  "response-dto": {
    definition: TASK4_DEFINITION,
    loadAdapter: loadTask4Adapter,
    successPanel: <EntityDtoComparisonPanel />,
  },
};

/** Renders the exercise card for whichever task is currently active, reading everything from workshop context. */
export function ActiveExerciseCard() {
  const { state, activeTaskId } = useWorkshop();

  if (!activeTaskId || !state.language) {
    return null;
  }

  // Keying on language too, not just the task id: a language switch keeps
  // the same task active but must reset the "Check solution" state, since
  // a check performed against the old track's code must not carry over to
  // stale-looking Continue permission for the new track's starter code.
  const key = `${activeTaskId}:${state.language}`;

  const real = REAL_TASKS[activeTaskId];
  if (real) {
    return (
      <ExerciseRunner
        key={key}
        taskId={activeTaskId}
        definition={real.definition}
        loadAdapter={real.loadAdapter}
        language={state.language}
        successPanel={real.successPanel}
      />
    );
  }

  return (
    <ExerciseCard
      key={key}
      task={taskDefinition(activeTaskId)}
      progress={state.tasks[activeTaskId]}
      language={state.language}
    />
  );
}
