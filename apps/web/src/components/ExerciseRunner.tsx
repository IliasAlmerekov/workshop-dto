"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import type { TaskDefinition } from "@/lib/exercises/types";
import type {
  TaskLanguageAdapter,
  ValidationResult,
} from "@/lib/exercises/types";
import type { Language, TaskId } from "@/lib/workshop/types";
import { CodeMirrorEditor } from "./CodeMirrorEditor";

const MAX_HINT_STAGE = 4; // 3 progressive cards + "Insert solution" as the 4th step

type ExerciseRunnerProps = {
  taskId: TaskId;
  definition: TaskDefinition;
  loadAdapter: (language: Language) => Promise<TaskLanguageAdapter>;
  language: Language;
  /** Extra content shown once the check passes — e.g. Task 4's live Entity-vs-DTO comparison (spec 6.4). */
  successPanel?: ReactNode;
};

function ClipboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="5"
        y="4"
        width="14"
        height="17"
        rx="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M9 4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V6H9V4.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 11h6M9 15h4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckGlyph({ passed }: { passed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
        passed
          ? "bg-[var(--accent-soft)] text-[var(--accent)]"
          : "bg-amber-500/15 text-amber-600"
      }`}
    >
      {passed ? "✓" : "!"}
    </span>
  );
}

/**
 * The reusable exercise runner (issue #4's "tracer bullet", extended in
 * issue #5 to a second task): a real CodeMirror editor with a restricted
 * TODO region, Lezer-AST validation, progressive hints, and Insert
 * solution — parameterized by task definition and adapter loader so every
 * task shares one implementation of the interaction, not just the look.
 */
export function ExerciseRunner({
  taskId,
  definition,
  loadAdapter,
  language,
  successPanel,
}: ExerciseRunnerProps) {
  const { state, updateDraft, recordHintUsed, completeTask } = useWorkshop();
  const progress = state.tasks[taskId];

  const [adapter, setAdapter] = useState<TaskLanguageAdapter | null>(null);
  const [checkResult, setCheckResult] = useState<ValidationResult | null>(null);
  const [insertGeneration, setInsertGeneration] = useState(0);

  useEffect(() => {
    let cancelled = false;
    // Deferred on purpose: switching language means an entirely different
    // adapter/grammar bundle has to load asynchronously, so the previous
    // one's check state is stale the instant `language` changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdapter(null);
    setCheckResult(null);
    setInsertGeneration(0);
    loadAdapter(language)
      .then((loaded) => {
        if (!cancelled) {
          setAdapter(loaded);
        }
      })
      .catch(() => {
        /* handled by adapter staying null; the loading state persists */
      });
    return () => {
      cancelled = true;
    };
  }, [language, loadAdapter]);

  if (!adapter) {
    return (
      <section className="flex flex-col gap-6 px-8 py-8">
        <p className="text-sm text-[var(--muted)]">Loading exercise…</p>
      </section>
    );
  }

  const hintStage = progress.hintsUsed;
  const editableValue = progress.touched
    ? progress.draft
    : adapter.starterCode.editable;

  function handleEditableChange(text: string) {
    updateDraft(taskId, text);
    setCheckResult(null);
  }

  function handleCheck() {
    const document =
      adapter!.starterCode.before + editableValue + adapter!.starterCode.after;
    setCheckResult(adapter!.validate(document));
  }

  function handleShowHint() {
    if (hintStage < 3) {
      recordHintUsed(taskId);
    }
  }

  function handleInsertSolution() {
    updateDraft(taskId, adapter!.solutionEditable);
    setInsertGeneration((value) => value + 1);
    setCheckResult(adapter!.validate(adapter!.solutionCode));
    if (hintStage < MAX_HINT_STAGE) {
      recordHintUsed(taskId);
    }
  }

  const visibleHints = adapter.hints.slice(0, hintStage);
  const canShowMoreCards = hintStage < 3;

  return (
    <section className="flex flex-col gap-6 px-8 py-8">
      <div>
        <p className="text-xs font-semibold tracking-[0.12em] text-[var(--accent)] uppercase">
          Exercise {String(definition.order).padStart(2, "0")}
        </p>
        <h1 className="mt-3 text-[2.75rem] leading-[1.05] font-bold tracking-tight">
          {definition.title}
        </h1>
        <p className="mt-2 text-lg text-[var(--muted)]">
          {definition.question}
        </p>
        <p className="mt-4 max-w-xl text-sm leading-relaxed text-[var(--muted)]">
          {definition.description}
        </p>
      </div>

      <div className="flex gap-4 rounded-xl border border-[var(--border)] p-5">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent)]"
        >
          <ClipboardIcon />
        </span>
        <div>
          <p className="text-sm font-semibold">Your task</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Complete{" "}
            <code className="font-mono text-[var(--accent)]">
              {adapter.fileName}
            </code>{" "}
            with the following:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {definition.fields.map((field) => (
              <span
                key={field}
                className="rounded-md border border-[var(--border)] bg-[var(--surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--accent)]"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>

      <CodeMirrorEditor
        language={language}
        fileName={adapter.fileName}
        before={adapter.starterCode.before}
        editable={editableValue}
        after={adapter.starterCode.after}
        resetKey={`${language}:${insertGeneration}`}
        onEditableChange={handleEditableChange}
        label={`Your solution for ${definition.title}`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCheck}
          className="flex items-center gap-2 rounded-lg bg-[var(--foreground)] px-5 py-3 text-sm font-semibold text-[var(--background)]"
        >
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M8 5.5v13l11-6.5-11-6.5Z" />
          </svg>
          Check solution
        </button>

        {canShowMoreCards ? (
          <button
            type="button"
            onClick={handleShowHint}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] px-5 py-3 text-sm font-semibold"
          >
            <svg
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.5.4.8 1 .9 1.7h5.4c.1-.7.4-1.3.9-1.7A6 6 0 0 0 12 3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Show hint
          </button>
        ) : (
          <button
            type="button"
            onClick={handleInsertSolution}
            className="flex items-center gap-2 rounded-lg border border-amber-500/50 px-5 py-3 text-sm font-semibold text-amber-600"
          >
            Insert solution
          </button>
        )}

        <button
          type="button"
          disabled={!checkResult?.passed}
          onClick={() => completeTask(taskId)}
          className="ml-auto flex items-center gap-2 rounded-lg bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-[var(--accent-foreground)] disabled:cursor-not-allowed disabled:bg-[var(--border)] disabled:text-[var(--muted)]"
        >
          Continue
          <span aria-hidden="true">→</span>
        </button>
      </div>

      {visibleHints.length > 0 && (
        <div className="flex flex-col gap-2">
          {visibleHints.map((hint, index) => (
            <div
              key={index}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 text-xs text-[var(--muted)]"
            >
              <p>{hint.text}</p>
              {hint.kind === "syntax" && (
                <code className="mt-2 block font-mono text-[var(--accent)]">
                  {hint.code}
                </code>
              )}
            </div>
          ))}
        </div>
      )}

      {checkResult && (
        <div
          role="status"
          className="flex flex-col gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4"
        >
          {checkResult.checks.map((check) => (
            <div key={check.id} className="flex items-start gap-2 text-xs">
              <CheckGlyph passed={check.passed} />
              <span
                className={
                  check.passed
                    ? "text-[var(--muted)]"
                    : "text-[var(--foreground)]"
                }
              >
                {check.message}
              </span>
            </div>
          ))}
        </div>
      )}

      {checkResult?.passed && (
        <p className="rounded-lg border border-[var(--accent)]/40 bg-[var(--accent-soft)] p-3 text-xs text-[var(--foreground)]">
          {definition.explanation}
        </p>
      )}

      {checkResult?.passed && successPanel}
    </section>
  );
}
