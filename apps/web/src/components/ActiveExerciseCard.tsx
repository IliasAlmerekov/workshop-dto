"use client";

import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { taskDefinition } from "@/lib/workshop/tasks";
import { ExerciseCard } from "./ExerciseCard";

/** Renders the exercise card for whichever task is currently active, reading everything from workshop context. */
export function ActiveExerciseCard() {
  const { state, activeTaskId } = useWorkshop();

  if (!activeTaskId || !state.language) {
    return null;
  }

  return (
    // Keying on language too, not just the task id: a language switch keeps
    // the same task active but must reset the "Check solution" state, since
    // a check performed against the old track's code must not carry over to
    // stale-looking Continue permission for the new track's starter code.
    <ExerciseCard
      key={`${activeTaskId}:${state.language}`}
      task={taskDefinition(activeTaskId)}
      progress={state.tasks[activeTaskId]}
      language={state.language}
    />
  );
}
