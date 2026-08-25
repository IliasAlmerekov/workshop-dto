"use client";

import { TASK_DEFINITIONS } from "@/lib/workshop/tasks";
import { useMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { IconLock } from "./ui/icons";
import type { TaskId, WorkshopState } from "@/lib/workshop/types";

type StepperProps = {
  tasks: WorkshopState["tasks"];
  activeTaskId: TaskId | null;
};

/** `Icon/check` for a step already passed — the library's badge glyph at 38px. */
function CheckGlyph() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3.75 9.375L7.125 12.75L14.25 5.25"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Sequential task navigation (Figma `Exercise Stepper`, 40:105, built from
 * `Step Item`, 39:43).
 *
 * A step is a round badge plus its title; the active one fills with
 * `bg/accent` and goes Bold, a passed one keeps the accent as a tint, and a
 * locked one stays on `bg/surface` behind a hairline with a lock chip beside
 * it. Dashed connectors carry the eye between them, and a 3px accent bar
 * underlines the step you are on.
 *
 * Sized down from the library's 87px band: the whole pipeline has to sit in
 * the work column beside the Result panel on one non-scrolling page, so the
 * badge shrinks to 28px, the connector flexes instead of holding 113px, and
 * only the active step keeps its title at every width — the locked ones drop
 * to badge-plus-lock once the row would otherwise overflow.
 *
 * The connector is CSS rather than the exported asset: it is a plain dashed
 * rule whose length has to flex with the row, which a fixed-width SVG cannot.
 */
export function Stepper({ tasks, activeTaskId }: StepperProps) {
  const messages = useMessages();

  return (
    <ol
      aria-label={messages.stepper.label}
      className="flex min-h-[52px] w-full items-center"
    >
      {TASK_DEFINITIONS.map((task, index) => {
        const progress = tasks[task.id];
        const isActive = task.id === activeTaskId;
        const isLocked = !progress.completed && !isActive;

        return (
          <li
            key={task.id}
            className={cn(
              "flex min-w-0 items-center",
              // Only the connectors stretch; the steps keep their own width.
              index > 0 && "min-w-0 flex-1",
            )}
          >
            {index > 0 && (
              <span
                aria-hidden="true"
                className="mx-8 h-0 min-w-8 flex-1 border-t-[1.5px] border-dashed border-[var(--border-strong)] xl:mx-14"
              />
            )}
            <div
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex min-w-0 items-center gap-8 self-stretch border-b-[3px] py-10",
                isActive
                  ? "border-[var(--accent-solid)]"
                  : "border-transparent",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "text-label-caption leading-label-caption flex size-[28px] shrink-0 items-center justify-center rounded-full font-medium",
                  isActive
                    ? "bg-[var(--accent-solid)] text-[var(--accent-foreground)]"
                    : progress.completed
                      ? "bg-[var(--accent-soft)] text-[var(--accent-on-soft)]"
                      : "border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)]",
                )}
              >
                {progress.completed ? (
                  <CheckGlyph />
                ) : (
                  String(index + 1).padStart(2, "0")
                )}
              </span>
              <span
                className={cn(
                  "text-body-compact leading-body-compact tracking-body-compact truncate",
                  isActive
                    ? "font-bold text-[var(--foreground)]"
                    : // A locked title is the first thing to go when the row
                      // is tight; the badge and lock still carry the state.
                      "hidden text-[var(--muted)] md:inline",
                )}
              >
                {messages.tasks[task.id]?.shortTitle ?? task.shortTitle}
              </span>
              {isLocked && (
                <span
                  role="img"
                  aria-label={messages.stepper.locked}
                  className="flex size-[22px] shrink-0 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--disabled-foreground)]"
                >
                  <IconLock size={12} />
                </span>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
