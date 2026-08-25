"use client";

import {
  CHECK_RUN_STEPS,
  stepStatus,
  type CheckRunProgress,
  type CheckRunStepId,
  type CheckRunStepStatus,
} from "@/lib/workshop/checkRun";
import { useMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  IconCircleCheck,
  IconCircleDashed,
  IconCircleX,
  IconSpinner,
  IconTerminal,
} from "./ui/icons";

type CheckRunStepsProps = {
  run: CheckRunProgress;
  /** Borderless, for the exercise column's fallback below the editor. */
  bare?: boolean;
  className?: string;
};

function StepGlyph({ status }: { status: CheckRunStepStatus }) {
  if (status === "done") {
    return <IconCircleCheck size={16} />;
  }
  if (status === "failed") {
    return <IconCircleX size={16} />;
  }
  if (status === "active") {
    return <IconSpinner size={16} className="check-run-spinner" />;
  }
  return <IconCircleDashed size={16} />;
}

const GLYPH_TONE: Record<CheckRunStepStatus, string> = {
  pending: "text-[var(--muted)] opacity-50",
  active: "text-[var(--accent)]",
  done: "text-[var(--success)]",
  failed: "text-[var(--danger)]",
};

const LABEL_TONE: Record<CheckRunStepStatus, string> = {
  pending: "text-[var(--muted)] opacity-60",
  active: "font-semibold text-[var(--foreground)]",
  done: "text-[var(--muted)]",
  failed: "font-semibold text-[var(--foreground)]",
};

/**
 * The stage list `Check solution` plays before its verdict lands.
 *
 * Deliberately quiet: one row per stage, a connector between the glyphs, and
 * a progress rail across the top — the same reading order as the verdict card
 * that replaces it, so the swap is a change of content, not of layout.
 *
 * The list itself is `aria-hidden`. It changes four times in a second inside
 * the result column's `aria-live` region, which would make a screen reader
 * read four half-finished sentences before the verdict it actually wants.
 * One stable "Running checks…" line is announced in its place, and the
 * verdict announces itself when it arrives.
 */
export function CheckRunSteps({ run, bare, className }: CheckRunStepsProps) {
  const messages = useMessages();
  const copy = messages.result.run;
  const total = CHECK_RUN_STEPS.length;
  const percent = Math.round((Math.min(run.step, total) / total) * 100);

  const labels: Record<CheckRunStepId, string> = {
    parse: copy.steps.parse(run.fileName),
    structure: copy.steps.structure,
    rules: copy.steps.rules(run.checkCount),
    report: copy.steps.report,
  };

  return (
    <section
      className={cn(
        "shrink-0 overflow-hidden",
        !bare && "rounded-xl border border-[var(--border)] bg-[var(--surface)]",
        className,
      )}
    >
      <p className="sr-only">{copy.announcement}</p>

      <div
        aria-hidden="true"
        className="flex items-center gap-8 border-b border-[var(--border)] px-12 py-8"
      >
        <span className="flex size-[22px] shrink-0 items-center justify-center rounded-md bg-[var(--surface-raised)] text-[var(--accent)]">
          <IconTerminal size={14} />
        </span>
        <p className="text-body-compact leading-body-compact min-w-0 flex-1 truncate font-semibold text-[var(--foreground)]">
          {copy.title}
        </p>
        <span className="text-label-caption leading-label-caption shrink-0 font-semibold tabular-nums text-[var(--muted)]">
          {copy.progress(Math.min(run.step, total), total)}
        </span>
      </div>

      <div
        aria-hidden="true"
        className="h-[3px] w-full bg-[var(--border)]"
        role="presentation"
      >
        <div
          className="check-run-rail h-full rounded-r-full bg-[var(--accent)]"
          style={{ width: `${percent}%` }}
        />
      </div>

      <ol aria-hidden="true" className="flex flex-col px-12 py-10">
        {CHECK_RUN_STEPS.map((id, index) => {
          const status = stepStatus(index, run);
          const last = index === total - 1;

          return (
            <li key={id} className="flex gap-8">
              <div className="flex shrink-0 flex-col items-center">
                <span
                  className={cn(
                    "flex size-[18px] items-center justify-center transition-colors duration-150 motion-reduce:transition-none",
                    GLYPH_TONE[status],
                  )}
                >
                  <StepGlyph status={status} />
                </span>
                {!last && (
                  <span
                    className={cn(
                      "w-px flex-1 transition-colors duration-150 motion-reduce:transition-none",
                      status === "pending"
                        ? "bg-[var(--border)]"
                        : "bg-[var(--accent)]/45",
                    )}
                  />
                )}
              </div>
              <p
                className={cn(
                  "text-body-compact leading-body-compact min-w-0 flex-1 transition-colors duration-150 motion-reduce:transition-none",
                  last ? "pb-0" : "pb-8",
                  LABEL_TONE[status],
                )}
              >
                {labels[id]}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
