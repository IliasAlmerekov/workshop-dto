"use client";

import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { taskDefinition } from "@/lib/workshop/tasks";
import { ExerciseCard } from "./ExerciseCard";
import { Task1Runner } from "./Task1Runner";

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

  // Task 1 is the reusable exercise runner's tracer bullet (issue #4): a
  // real CodeMirror editor with restricted editing and Lezer-based
  // validation. Tasks 2-4 stay on the older placeholder flow until they get
  // the same treatment.
  if (activeTaskId === "request-dto") {
    return <Task1Runner key={key} language={state.language} />;
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
