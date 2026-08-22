import type { ReactNode } from "react";
import type { TaskDefinition } from "@/lib/workshop/tasks";
import { firstSentence } from "@/lib/firstSentence";
import { IsometricStack } from "./IsometricStack";

type ExerciseSidebarProps = {
  task: TaskDefinition;
  nextTitle: string | null;
};

const ICONS: Record<string, ReactNode> = {
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="1.2" fill="currentColor" />
    </>
  ),
  shield: (
    <>
      <path
        d="M12 3.5 5.5 6v5.4c0 4 2.7 7.6 6.5 8.6 3.8-1 6.5-4.6 6.5-8.6V6L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9.3 12 2 2 3.4-3.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  arrow: (
    <path
      d="M4.5 12h15m0 0-5.5-5.5M19.5 12 14 17.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 7.5V12l3 1.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
};

function InfoRow({
  icon,
  title,
  children,
  trailing,
}: {
  icon: keyof typeof ICONS;
  title: string;
  children?: string;
  trailing?: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--border)] px-5 py-4 last:border-b-0">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]"
      >
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none">
          {ICONS[icon]}
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {children && (
          <p className="mt-0.5 text-sm text-[var(--muted)]">{children}</p>
        )}
      </div>
      {trailing && (
        <span className="shrink-0 text-sm text-[var(--muted)]">{trailing}</span>
      )}
    </div>
  );
}

export function ExerciseSidebar({ task, nextTitle }: ExerciseSidebarProps) {
  return (
    <aside className="flex flex-col gap-8 border-l border-[var(--border)] px-8 py-8">
      <div className="-mx-4 flex justify-center">
        <IsometricStack size={430} highlight="Request DTO" />
      </div>

      <div className="rounded-xl border border-[var(--border)]">
        <InfoRow icon="target" title={`Define the ${task.title}`}>
          {firstSentence(task.description)}
        </InfoRow>
        <InfoRow icon="shield" title="Why it matters">
          Strong contracts at system boundaries prevent bugs and make your
          transformations visible and testable.
        </InfoRow>
        <InfoRow icon="arrow" title="What&rsquo;s next">
          {nextTitle
            ? `You'll continue with "${nextTitle}" in the next step.`
            : "This is the final exercise of the workshop."}
        </InfoRow>
        <InfoRow
          icon="clock"
          title="Estimated time"
          trailing={`${task.estimatedMinutes} min`}
        />
      </div>
    </aside>
  );
}
