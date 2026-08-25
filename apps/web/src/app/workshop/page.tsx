"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkshopHeader } from "@/components/WorkshopHeader";
import { Stepper } from "@/components/Stepper";
import { ActiveExerciseCard } from "@/components/ActiveExerciseCard";
import { ExerciseResultPanel } from "@/components/ExerciseResultPanel";
import { CompletionScreen } from "@/components/CompletionScreen";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { ExerciseResultProvider } from "@/lib/workshop/ExerciseResultContext";
import { taskDefinition } from "@/lib/workshop/tasks";

export default function WorkshopPage() {
  const { state, hydrated, activeTaskId, selectTask } = useWorkshop();
  const router = useRouter();

  useEffect(() => {
    if (hydrated && !state.language) {
      router.replace("/");
    }
  }, [hydrated, state.language, router]);

  if (!hydrated || !state.language) {
    return null;
  }

  const activeTask = activeTaskId ? taskDefinition(activeTaskId) : null;

  return (
    /* One screen, not a document: the workshop frame is exactly the viewport
       tall and never scrolls itself, so the app bar, the pipeline and the
       Result column stay put while only the panes that genuinely overflow
       scroll inside their own bounds. `dvh` rather than `vh`, so mobile
       browser chrome cannot push the action row under the fold. */
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--surface)]">
      <WorkshopHeader />

      {activeTask ? (
        // The result column is a flexible rail rather than a fixed 400px: it
        // holds one payload and one produced object, so it takes a share of
        // the width and gives the rest to the editor beside it.
        <ExerciseResultProvider>
          <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_minmax(340px,32vw)] 2xl:grid-cols-[minmax(0,1fr)_440px] lg:grid-rows-1">
            <div className="flex min-h-0 min-w-0 flex-col">
              <div className="workshop-gutter shrink-0 border-b border-[var(--border)] bg-[var(--surface)]">
                <Stepper
                  tasks={state.tasks}
                  activeTaskId={activeTaskId}
                  onSelectTask={selectTask}
                />
              </div>
              <ActiveExerciseCard />
            </div>
            <ExerciseResultPanel task={activeTask} />
          </div>
        </ExerciseResultProvider>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <CompletionScreen />
        </div>
      )}
    </div>
  );
}
