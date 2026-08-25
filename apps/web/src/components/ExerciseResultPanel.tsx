"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { TaskDefinition } from "@/lib/workshop/tasks";
import { TASK_DEFINITIONS } from "@/lib/workshop/tasks";
import type { ValidationCheck } from "@/lib/exercises/types";
import { useExerciseResult } from "@/lib/workshop/ExerciseResultContext";
import { useMessages } from "@/lib/i18n";
import { runTask, type RunField } from "@/lib/workshop/taskRun";
import { CheckRunSteps } from "./CheckRunSteps";
import { cn } from "@/lib/utils";
import {
  IconChevronUp,
  IconCircleCheck,
  IconCircleX,
  IconTerminal,
  IconXOnDisc,
} from "./ui/icons";

type ExerciseResultPanelProps = {
  task: TaskDefinition;
};

/** A bordered block on `bg/surface` — the panel's one structural unit. */
function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "shrink-0 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** A card's title strip: a small badge, the title, and an optional trailing slot. */
function CardHeader({
  icon,
  title,
  trailing,
}: {
  icon?: ReactNode;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-8 border-b border-[var(--border)] px-12 py-8">
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-[22px] shrink-0 items-center justify-center rounded-md bg-[var(--surface-raised)] text-[var(--muted)]"
        >
          {icon}
        </span>
      )}
      <p className="text-body-compact leading-body-compact min-w-0 flex-1 truncate font-semibold text-[var(--foreground)]">
        {title}
      </p>
      {trailing}
    </div>
  );
}

/** The `N / M checks passed` counter, tinted by the verdict it reports. */
function CountPill({ passed, label }: { passed: boolean; label: string }) {
  return (
    <span
      className={cn(
        "text-label-caption leading-label-caption shrink-0 rounded-full border px-10 py-2 font-semibold whitespace-nowrap",
        passed
          ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success-on-soft)]"
          : "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]",
      )}
    >
      {label}
    </span>
  );
}

/**
 * One check. The glyph, the colour and the trailing word all say the same
 * thing, so the row survives a colourblind reader and a greyscale print.
 */
function CheckRow({ check }: { check: ValidationCheck }) {
  const messages = useMessages();

  return (
    <li className="flex items-start gap-8 px-12 py-6">
      <span
        aria-hidden="true"
        className={cn(
          "mt-px shrink-0",
          check.passed ? "text-[var(--success)]" : "text-[var(--danger)]",
        )}
      >
        {check.passed ? (
          <IconCircleCheck size={16} />
        ) : (
          <IconCircleX size={16} />
        )}
      </span>
      <span className="text-body-compact leading-body-compact min-w-0 flex-1 text-[var(--foreground)]">
        {check.message}
      </span>
      <span
        className={cn(
          "text-label-caption leading-label-caption shrink-0 font-semibold",
          check.passed ? "text-[var(--success)]" : "text-[var(--danger)]",
        )}
      >
        {check.passed
          ? messages.result.checkPassed
          : messages.result.checkFailed}
      </span>
    </li>
  );
}

/** Quoted for text and dates, bare for numbers and booleans — as JSON prints them. */
function literal(field: RunField): string {
  return field.kind === "number" || field.kind === "boolean"
    ? field.value
    : `"${field.value}"`;
}

function OutputLine({
  field,
  index,
  last,
}: {
  field: RunField;
  index: number;
  last: boolean;
}) {
  return (
    <div
      className="result-reveal pl-14 whitespace-pre"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <span className="text-[var(--accent)]">&quot;{field.key}&quot;</span>
      <span className="text-[var(--muted)]">: </span>
      <span className="text-[var(--foreground)]">{literal(field)}</span>
      {!last && <span className="text-[var(--muted)]">,</span>}
    </div>
  );
}

/**
 * The workshop's right-hand column: the validation report for the last
 * `Check solution` press, laid out as the reference specifies — a verdict
 * banner over the per-check list, then either the produced object or the
 * guidance needed to fix what failed.
 *
 * Nothing here executes participant code (spec 9.1, and CLAUDE.md's first
 * invariant). That is why the failing state carries no compiler or type-error
 * transcript: there is no compiler in this app to produce one. What it shows
 * instead is the real thing the app knows — the business rules the Lezer-AST
 * validator found broken — as the list of what to fix. Feedback names the
 * violated rule and never hands over the solution.
 */
export function ExerciseResultPanel({ task }: ExerciseResultPanelProps) {
  const messages = useMessages();
  const run = runTask(task.id);
  const published = useExerciseResult(task.id);
  const [guidanceOpen, setGuidanceOpen] = useState(false);

  const activeRun = published?.run ?? null;
  const checks = published?.result?.checks ?? [];
  const passedChecks = checks.filter((check) => check.passed).length;
  const passed = published?.result?.passed === true;
  const failedChecks = checks.filter((check) => !check.passed);

  const nextTask = TASK_DEFINITIONS.find(
    (definition) => definition.order === task.order + 1,
  );

  return (
    <aside className="workshop-gutter-end flex min-h-0 flex-col border-t border-[var(--border)] bg-[var(--background)] py-14 font-[var(--font-inter)] lg:border-t-0 lg:border-l">
      <div
        role="status"
        aria-live="polite"
        className="flex min-h-0 flex-1 flex-col gap-8 overflow-y-auto"
      >
        {activeRun ? (
          /* The stage list stands in for the verdict card while a check
             runs — same slot, same border, so nothing below it moves when
             the verdict replaces it. */
          <CheckRunSteps run={activeRun} />
        ) : !published ? (
          <Card>
            <CardHeader
              icon={<IconTerminal size={14} />}
              title={messages.result.outputTitle}
            />
            <div className="flex items-center justify-center px-12 py-20">
              <p className="text-body-compact leading-body-compact max-w-[30ch] text-center text-[var(--muted)]">
                {messages.result.idle}
              </p>
            </div>
          </Card>
        ) : (
          <>
            {/* Verdict — the one thing a participant looks for first. */}
            <Card>
              <CardHeader
                icon={<IconTerminal size={14} />}
                title={messages.result.outputTitle}
                trailing={
                  <CountPill
                    passed={passed}
                    label={messages.result.testsPassed(
                      passedChecks,
                      checks.length,
                    )}
                  />
                }
              />

              {passed ? (
                <div className="flex items-center gap-10 px-12 py-10">
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[var(--success)]"
                  >
                    <IconCircleCheck size={26} />
                  </span>
                  <div className="min-w-0">
                    <p className="text-body leading-body font-bold text-[var(--success)]">
                      {messages.result.passedHeadline}
                    </p>
                    <p className="text-body-panel leading-body-panel text-[var(--muted)]">
                      {messages.result.passedSubline}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-6 px-12 py-10">
                  <div className="flex items-center gap-10">
                    <span
                      aria-hidden="true"
                      className="shrink-0 text-[var(--danger-solid)]"
                    >
                      <IconXOnDisc size={24} />
                    </span>
                    <p className="text-body leading-body font-bold text-[var(--danger)]">
                      {messages.result.failedHeadline}
                    </p>
                  </div>
                  <p className="text-body-panel leading-body-panel text-[var(--muted)]">
                    {messages.result.failedSubline}
                  </p>
                </div>
              )}

              {/* The checks sit in the verdict card in both states: the list
                  *is* the explanation, and a separate "Checks" card only
                  added a second header strip saying the same thing. */}
              <ul className="divide-y divide-[var(--border)] border-t border-[var(--border)]">
                {checks.map((check) => (
                  <CheckRow key={check.id} check={check} />
                ))}
              </ul>
            </Card>

            {passed && (
              <>
                {/* The produced object — the sample payload through a correct
                    mapper, never through the participant's code. The
                    "your type is valid" banner the reference puts here is
                    dropped: the verdict card two rows up already said it. */}
                <Card>
                  <CardHeader title={messages.result.outputSectionTitle} />
                  <div className="text-body-panel leading-code-editor px-12 py-10 font-mono">
                    <div className="text-[var(--muted)]">{"{"}</div>
                    {run.fields.map((field, index) => (
                      <OutputLine
                        key={field.key}
                        field={field}
                        index={index}
                        last={index === run.fields.length - 1}
                      />
                    ))}
                    <div className="text-[var(--muted)]">{"}"}</div>
                  </div>
                </Card>

                <Card>
                  <div className="flex items-center gap-10 px-12 py-10">
                    <div className="min-w-0 flex-1">
                      <p className="text-body-compact leading-body-compact font-semibold text-[var(--foreground)]">
                        {nextTask
                          ? messages.result.nextStepLead(
                              messages.tasks[nextTask.id].shortTitle,
                            )
                          : messages.result.lastStepLead}
                      </p>
                      {published.explanation && (
                        <p className="text-body-panel leading-body-panel mt-2 text-[var(--muted)]">
                          {published.explanation}
                        </p>
                      )}
                    </div>
                    {/* A status chip, not a button: the real Continue action
                        lives under the editor, and a screen gets one CTA. */}
                    <span className="text-label-caption leading-label-caption flex shrink-0 items-center gap-6 rounded-lg border border-[var(--success-border)] bg-[var(--success-soft)] px-8 py-4 font-semibold text-[var(--success-on-soft)]">
                      <IconCircleCheck size={13} />
                      {messages.result.nextStepReady}
                    </span>
                  </div>
                </Card>
              </>
            )}

            {!passed && failedChecks.length > 0 && (
              <Card>
                <button
                  type="button"
                  onClick={() => setGuidanceOpen((open) => !open)}
                  aria-expanded={guidanceOpen}
                  className="flex w-full cursor-pointer items-center gap-8 px-12 py-8 text-left"
                >
                  <span className="text-body-compact leading-body-compact min-w-0 flex-1 font-semibold text-[var(--foreground)]">
                    {messages.result.guidanceTitle}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "shrink-0 text-[var(--muted)] transition-transform duration-150 motion-reduce:transition-none",
                      guidanceOpen ? "" : "rotate-180",
                    )}
                  >
                    <IconChevronUp size={16} />
                  </span>
                </button>

                {guidanceOpen && (
                  <div className="flex flex-col gap-10 border-t border-[var(--border)] px-12 py-10">
                    <div>
                      <p className="text-label-caption leading-label-caption font-semibold text-[var(--muted)]">
                        {messages.result.whatToFix}
                      </p>
                      <ul className="mt-6 flex flex-col gap-4">
                        {failedChecks.map((check) => (
                          <li
                            key={check.id}
                            className="text-body-panel leading-body-panel flex items-start gap-8 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] px-8 py-6 text-[var(--foreground)]"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-px shrink-0 text-[var(--danger)]"
                            >
                              <IconCircleX size={15} />
                            </span>
                            <span>{check.message}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <p className="text-body-panel leading-body-panel text-[var(--muted)]">
                      {messages.result.needNudge}
                    </p>
                  </div>
                )}
              </Card>
            )}
          </>
        )}

        <p className="text-label-caption leading-label-caption shrink-0 pt-2 text-[var(--muted)]">
          {messages.result.disclaimer}
        </p>
      </div>
    </aside>
  );
}
