"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { WorkshopHeader } from "@/components/WorkshopHeader";
import { Stepper } from "@/components/Stepper";
import { ActiveExerciseCard } from "@/components/ActiveExerciseCard";
import { ExerciseSidebar } from "@/components/ExerciseSidebar";
import { CompletionScreen } from "@/components/CompletionScreen";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { taskDefinition, nextTaskId } from "@/lib/workshop/tasks";

export default function WorkshopPage() {
  const { state, hydrated, activeTaskId } = useWorkshop();
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
  const upcomingId = activeTaskId ? nextTaskId(activeTaskId) : null;
  const upcomingTitle = upcomingId ? taskDefinition(upcomingId).title : null;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--surface)]">
      <WorkshopHeader />

      {activeTask ? (
        <div className="grid flex-1 lg:grid-cols-[minmax(0,1fr)_460px]">
          <div className="flex min-w-0 flex-col">
            <div className="border-b border-[var(--border)] px-8 pt-6">
              <Stepper tasks={state.tasks} activeTaskId={activeTaskId} />
            </div>
            <ActiveExerciseCard />
          </div>
          <ExerciseSidebar task={activeTask} nextTitle={upcomingTitle} />
        </div>
      ) : (
        <CompletionScreen />
      )}
    </div>
  );
}
