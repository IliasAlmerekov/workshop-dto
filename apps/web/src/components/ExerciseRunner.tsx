"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import {
  useHasResultSurface,
  usePublishExerciseResult,
} from "@/lib/workshop/ExerciseResultContext";
import type { TaskDefinition } from "@/lib/exercises/types";
import type {
  TaskLanguageAdapter,
  ValidationResult,
} from "@/lib/exercises/types";
import type { Language, TaskId } from "@/lib/workshop/types";
import { useMessages } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { useStagedCheckRun } from "@/lib/workshop/checkRun";
import { CheckRunSteps } from "./CheckRunSteps";
import { CodeMirrorEditor } from "./CodeMirrorEditor";
import { HintPopover } from "./HintPopover";
import { Button } from "./ui/Button";
import {
  IconArrowRight,
  IconCircleCheck,
  IconCircleX,
  IconClipboardList,
  IconPlay,
  IconSpinner,
} from "./ui/icons";

const MAX_HINT_STAGE = 4; // 3 progressive cards + "Insert solution" as the 4th step

type ExerciseRunnerProps = {
  taskId: TaskId;
  definition: TaskDefinition;
  loadAdapter: (language: Language) => Promise<TaskLanguageAdapter>;
  language: Language;
  /** Extra content shown once the check passes — e.g. Task 4's live Entity-vs-DTO comparison (spec 6.4). */
  successPanel?: ReactNode;
};

/**
 * The verdict glyph of the fallback report — the same pair the result column
 * uses (`status/success` / `status/danger`), drawn from the icon family rather
 * than typed as a character, so the two surfaces state a verdict identically.
 */
function CheckGlyph({ passed }: { passed: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "mt-px shrink-0",
        passed ? "text-[var(--success)]" : "text-[var(--danger)]",
      )}
    >
      {passed ? <IconCircleCheck size={16} /> : <IconCircleX size={16} />}
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

  const messages = useMessages();
  const copy = messages.tasks[taskId] ?? definition;
  const hintCopy = messages.hints[taskId]?.[language];
  const publishResult = usePublishExerciseResult();
  const hasResultSurface = useHasResultSurface();
  const [adapter, setAdapter] = useState<TaskLanguageAdapter | null>(null);
  const [checkResult, setCheckResult] = useState<ValidationResult | null>(null);
  const [insertGeneration, setInsertGeneration] = useState(0);
  const [hintsOpen, setHintsOpen] = useState(false);
  /**
   * `Check solution` plays the validator's stages before its verdict lands
   * (see `checkRun.ts`). The verdict is decided the moment the button is
   * pressed; `run` only withholds it for the length of the stage list.
   */
  const {
    run,
    start: startCheckRun,
    cancel: cancelCheckRun,
  } = useStagedCheckRun(setCheckResult);

  useEffect(() => {
    let cancelled = false;
    // Deferred on purpose: switching language means an entirely different
    // adapter/grammar bundle has to load asynchronously, so the previous
    // one's check state is stale the instant `language` changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdapter(null);
    setCheckResult(null);
    setInsertGeneration(0);
    cancelCheckRun();
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
  }, [language, loadAdapter, cancelCheckRun]);

  /**
   * The result column reads the same verdict this card does. Publishing from
   * an effect (rather than from the handlers) keeps one source of truth:
   * clearing `checkResult` on the next keystroke re-locks the output too.
   */
  useEffect(() => {
    if (run) {
      publishResult({ taskId, result: null, run });
      return;
    }
    publishResult(
      checkResult
        ? { taskId, result: checkResult, explanation: copy.explanation }
        : null,
    );
  }, [publishResult, taskId, run, checkResult, copy.explanation]);

  useEffect(() => () => publishResult(null), [publishResult]);

  if (!adapter) {
    return (
      <section className="workshop-gutter flex min-h-0 flex-1 flex-col py-18">
        <p role="status" className="text-body-small text-[var(--muted)]">
          {messages.exercise.loading}
        </p>
      </section>
    );
  }

  const hintStage = progress.hintsUsed;
  const editableValue = progress.touched
    ? progress.draft
    : adapter.starterCode.editable;

  function handleEditableChange(text: string) {
    updateDraft(taskId, text);
    cancelCheckRun();
    setCheckResult(null);
  }

  function handleCheck() {
    const document =
      adapter!.starterCode.before + editableValue + adapter!.starterCode.after;
    startCheckRun(adapter!.validate(document), {
      fileName: adapter!.fileName,
    });
  }

  function handleShowHint() {
    if (hintStage < 3) {
      recordHintUsed(taskId);
    }
  }

  function handleInsertSolution() {
    updateDraft(taskId, adapter!.solutionEditable);
    setInsertGeneration((value) => value + 1);
    // The escape hatch settles at once: someone who asked for the answer is
    // owed the explanation, not a progress animation about it.
    startCheckRun(
      adapter!.validate(adapter!.solutionCode),
      { fileName: adapter!.fileName },
      { instant: true },
    );
    if (hintStage < MAX_HINT_STAGE) {
      recordHintUsed(taskId);
    }
  }

  // The hint *text* is translated; the code snippet beside it is not — it is
  // the language's own syntax, which every locale reads identically.
  const hintTexts = hintCopy
    ? [hintCopy.concept, hintCopy.fields, hintCopy.syntax]
    : adapter.hints.map((hint) => hint.text);
  const hintCards = adapter.hints.map((hint, index) => ({
    ...hint,
    text: hintTexts[index] ?? hint.text,
  }));
  const canShowMoreCards = hintStage < 3;
  const brief = copy.brief;

  return (
    /* The work column is height-bound by the page frame, so it lays out as
       three bands: a heading and brief that keep their intrinsic height, the
       editor that absorbs every remaining pixel, and the action row pinned
       under it. Only on viewports too short for that does the column itself
       scroll — the page around it never does. */
    <section className="workshop-gutter flex min-h-0 flex-1 flex-col gap-16 overflow-y-auto py-18 2xl:gap-20 2xl:py-24">
      {/* Exercise heading (Figma 42:108 – 42:111): the accent eyebrow, the
          52px page title, the framing question and the intro paragraph. */}
      <div className="shrink-0">
        <p className="text-label-caption leading-label-caption tracking-label-eyebrow font-bold text-[var(--accent)] uppercase">
          {messages.exercise.eyebrow(String(definition.order).padStart(2, "0"))}
        </p>
        {/* Heading/Page is 52px at the reference viewport; it scales with the
            column instead of forcing the row to overflow on a laptop. */}
        <h1 className="leading-heading-page tracking-heading-page mt-6 text-[clamp(1.5rem,2.6vw,52px)] font-bold text-[var(--foreground)]">
          {copy.title}
        </h1>
        <p className="tracking-body-question mt-6 text-[clamp(0.9375rem,1.15vw,19px)] leading-[1.45] text-[var(--foreground)]">
          {brief ? brief.situation.body : copy.question}
        </p>
        {/* The framing paragraph is the one genuinely optional line here, so a
            short viewport drops it rather than squeezing the editor. */}
        {!brief && (
          <p className="text-body-small leading-body-small mt-10 hidden max-w-[68ch] text-[var(--muted)] [@media(min-height:820px)]:block">
            {copy.description}
          </p>
        )}
      </div>

      {/* Task Brief (Figma 40:61): a 72px goal badge beside the instruction
          and the required field contract. Task 1 additionally exposes its
          real registration scenario, so the contract is never just a list. */}
      <div className="flex shrink-0 gap-14 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-14 2xl:gap-20 2xl:p-18">
        {/* The 72px goal badge is the library's; it steps down with the column
            so the brief stays one compact band on a laptop. */}
        <span
          aria-hidden="true"
          className="flex size-[44px] shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-on-soft)] 2xl:size-[56px]"
        >
          <IconClipboardList size={24} />
        </span>
        <div className="flex min-w-0 flex-col gap-6">
          <p className="text-heading-card leading-heading-card tracking-heading-card font-bold text-[var(--foreground)]">
            {messages.exercise.yourTask}
          </p>
          {brief ? (
            <>
              <div className="grid gap-x-10 gap-y-6 pt-2 sm:grid-cols-2">
                {[
                  [
                    brief.mission.title,
                    brief.mission.body.replace("{fileName}", adapter.fileName),
                  ],
                  [brief.doneWhen.title, brief.doneWhen.body],
                  [brief.notInThisStep.title, brief.notInThisStep.body],
                ].map(([title, body]) => (
                  <div key={title}>
                    <p className="text-label-caption leading-label-caption tracking-label-eyebrow font-bold uppercase text-[var(--accent)]">
                      {title}
                    </p>
                    <p className="text-body-small leading-body-small mt-1 text-[var(--muted)]">
                      {body}
                    </p>
                  </div>
                ))}
              </div>
              {brief.example ? (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-body-compact leading-body-compact text-[var(--muted)]">
                  <span className="font-semibold">
                    {brief.example.beforeLabel}
                  </span>
                  <code className="whitespace-pre font-mono text-[var(--accent)]">
                    {brief.example.beforeValue}
                  </code>
                  <IconArrowRight aria-hidden="true" size={16} />
                  <span className="font-semibold">
                    {brief.example.afterLabel}
                  </span>
                  <code className="whitespace-pre font-mono text-[var(--accent)]">
                    {brief.example.afterValue}
                  </code>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-body-small leading-body-small text-[var(--muted)]">
              <code className="text-body-compact font-mono text-[var(--accent)]">
                {adapter.fileName}
              </code>{" "}
              {messages.exercise.completeWith(adapter.fileName)}
            </p>
          )}
          <div className="flex flex-wrap gap-10 pt-2">
            {copy.fields.map((field) => (
              <span
                key={field}
                className="text-label-field-chip leading-label-field-chip tracking-label-field-chip flex h-28 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--surface)] px-10 font-semibold text-[var(--accent)]"
              >
                {field}
              </span>
            ))}
          </div>
        </div>
      </div>

      <CodeMirrorEditor
        fill
        language={language}
        fileName={adapter.fileName}
        before={adapter.starterCode.before}
        editable={editableValue}
        after={adapter.starterCode.after}
        resetKey={`${language}:${insertGeneration}`}
        onEditableChange={handleEditableChange}
        label={messages.exercise.editorLabel(copy.title)}
        completionInput={definition.completionInput}
      />

      {/* Action row (Figma `Button` variants 42:201 / 42:208 / 42:219). Check
          solution is the screen's one primary CTA in `bg/action` navy; the
          rest stay subordinate, and Continue holds the disabled fill until a
          check passes. */}
      <div className="flex shrink-0 flex-wrap items-center gap-8">
        <Button
          variant="primary"
          onClick={handleCheck}
          disabled={run !== null}
          aria-busy={run !== null}
          icon={
            run ? (
              <IconSpinner size={18} className="check-run-spinner" />
            ) : (
              <IconPlay size={18} />
            )
          }
        >
          {run ? messages.exercise.checking : messages.exercise.checkSolution}
        </Button>

        {/* The hints stay reachable after the solution unlocks — an escape
            hatch should not take the explanation away with it. */}
        <HintPopover
          hints={hintCards}
          shown={hintStage}
          onReveal={handleShowHint}
          open={hintsOpen}
          onOpenChange={setHintsOpen}
        />

        {!canShowMoreCards && (
          <Button
            variant="secondary"
            onClick={handleInsertSolution}
            className="border-amber-500/50 text-amber-600"
          >
            {messages.exercise.insertSolution}
          </Button>
        )}

        <Button
          variant="accent"
          disabled={!checkResult?.passed}
          onClick={() => completeTask(taskId)}
          className="ml-auto"
          iconAfter={<IconArrowRight size={18} />}
        >
          {messages.exercise.continue}
        </Button>
      </div>

      {run && !hasResultSurface && <CheckRunSteps run={run} />}

      {checkResult && !hasResultSurface && (
        <div
          role="status"
          className="flex flex-col gap-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-12 py-10"
        >
          {checkResult.checks.map((check) => (
            <div
              key={check.id}
              className="text-body-compact leading-body-compact flex items-start gap-8"
            >
              <CheckGlyph passed={check.passed} />
              <span
                className={cn(
                  "min-w-0 flex-1",
                  check.passed
                    ? "text-[var(--muted)]"
                    : "text-[var(--foreground)]",
                )}
              >
                {check.message}
              </span>
              <span
                className={cn(
                  "text-label-caption leading-label-caption shrink-0 font-semibold",
                  check.passed
                    ? "text-[var(--success)]"
                    : "text-[var(--danger)]",
                )}
              >
                {check.passed
                  ? messages.result.checkPassed
                  : messages.result.checkFailed}
              </span>
            </div>
          ))}
        </div>
      )}

      {checkResult?.passed && !hasResultSurface && (
        <p className="text-body-panel leading-body-panel rounded-xl border border-[var(--success-border)] bg-[var(--success-soft)] px-12 py-10 text-[var(--foreground)]">
          {copy.explanation}
        </p>
      )}

      {checkResult?.passed && successPanel}
    </section>
  );
}
