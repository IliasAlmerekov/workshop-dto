"use client";

import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { taskDefinition } from "@/lib/workshop/tasks";
import { TASK1_DEFINITION } from "@/lib/exercises/task1";
import { TASK2_DEFINITION } from "@/lib/exercises/task2";
import { loadTask1Adapter } from "@/lib/exercises/task1Adapters";
import { loadTask2Adapter } from "@/lib/exercises/task2Adapters";
import type { TaskDefinition } from "@/lib/exercises/types";
import type { TaskLanguageAdapter } from "@/lib/exercises/types";
import type { Language, TaskId } from "@/lib/workshop/types";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseRunner } from "./ExerciseRunner";

/**
 * Tasks that have graduated to the real CodeMirror + Lezer-validated
 * runner (issue #4, extended in issue #5). Tasks 3-4 stay on the older
 * placeholder flow until they get the same treatment.
 */
const REAL_TASKS: Partial<
  Record<
    TaskId,
    {
      definition: TaskDefinition;
      loadAdapter: (language: Language) => Promise<TaskLanguageAdapter>;
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
