import { TASK_DEFINITIONS } from "@/lib/workshop/tasks";
import type { TaskId, WorkshopState } from "@/lib/workshop/types";

type StepperProps = {
  tasks: WorkshopState["tasks"];
  activeTaskId: TaskId | null;
};

function LockIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="13"
      height="13"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5.5"
        y="10.5"
        width="13"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M8.5 10.5V7.5a3.5 3.5 0 1 1 7 0v3"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="15"
      height="15"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5.5 12.5 10 17l8.5-9.5"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Stepper({ tasks, activeTaskId }: StepperProps) {
  return (
    <ol className="flex items-center gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TASK_DEFINITIONS.map((task, index) => {
        const progress = tasks[task.id];
        const isActive = task.id === activeTaskId;
        const isLocked = !progress.completed && !isActive;

        return (
          <li key={task.id} className="flex shrink-0 items-center">
            {index > 0 && (
              <span
                aria-hidden="true"
                className="mx-4 h-px w-14 border-t border-dashed border-[var(--border)]"
              />
            )}
            <div
              aria-current={isActive ? "step" : undefined}
              className={`flex items-center gap-3 border-b-2 pb-4 ${
                isActive ? "border-[var(--accent)]" : "border-transparent"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ${
                  isActive
                    ? "bg-[var(--accent)] text-[var(--accent-foreground)]"
                    : progress.completed
                      ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                      : "border border-[var(--border)] text-[var(--muted)]"
                }`}
              >
                {progress.completed ? (
                  <CheckIcon />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <span
                className={`text-sm whitespace-nowrap ${
                  isActive
                    ? "font-semibold text-[var(--foreground)]"
                    : "text-[var(--muted)]"
                }`}
              >
                {task.shortTitle}
              </span>
              {isLocked && (
                <span className="text-[var(--muted)]" aria-label="locked">
                  <LockIcon />
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
