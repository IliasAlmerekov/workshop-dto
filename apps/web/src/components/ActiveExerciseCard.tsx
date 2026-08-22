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
    <ExerciseCard
      key={activeTaskId}
      task={taskDefinition(activeTaskId)}
      progress={state.tasks[activeTaskId]}
      language={state.language}
    />
  );
}
