"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ValidationResult } from "@/lib/exercises/types";

/**
 * The staged reveal behind `Check solution`.
 *
 * Pressing the button used to swap the whole verdict in on the same frame,
 * which read as "nothing happened" for a passing solution and gave a failing
 * one no moment of anticipation at all. The run below spends about a second
 * walking the four stages the validator actually goes through — parse the
 * file, read the syntax tree, apply the business rules, report — one row at a
 * time, the way a test runner does.
 *
 * It is a reveal, not a fiction: nothing is executed here either (CLAUDE.md's
 * first invariant). The verdict is computed *before* the run starts, and the
 * stages name the real work the Lezer-AST validator does. The delay buys
 * legibility, not fake compilation output.
 */
export const CHECK_RUN_STEPS = [
  "parse",
  "structure",
  "rules",
  "report",
] as const;

export type CheckRunStepId = (typeof CHECK_RUN_STEPS)[number];

export type CheckRunStepStatus = "pending" | "active" | "done" | "failed";

export type CheckRunProgress = {
  /** How many stages have finished; equals `CHECK_RUN_STEPS.length` when settled. */
  step: number;
  /** The file the checks read, shown in the first stage's label. */
  fileName: string;
  /** How many business rules the last stage will report on. */
  checkCount: number;
  /** The verdict the run is heading towards — drives the final stage's tint. */
  willPass: boolean;
};

/** Per stage. Four of them plus the closing beat lands just under a second. */
const STEP_MS = 230;
/** The pause between the last stage finishing and the verdict replacing it. */
const SETTLE_MS = 180;

export function stepStatus(
  index: number,
  run: CheckRunProgress,
): CheckRunStepStatus {
  if (index < run.step) {
    const isLast = index === CHECK_RUN_STEPS.length - 1;
    return isLast && !run.willPass ? "failed" : "done";
  }
  return index === run.step ? "active" : "pending";
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type StagedCheckRun = {
  /** Non-null while the stages are still playing. */
  run: CheckRunProgress | null;
  /** Plays the stages, then hands the verdict to `onSettle`. */
  start: (
    result: ValidationResult,
    meta: { fileName: string },
    options?: { instant?: boolean },
  ) => void;
  /** Drops an in-flight run without settling it — a keystroke invalidates it. */
  cancel: () => void;
};

/**
 * Sequences the stages with timers rather than CSS so the verdict, the
 * button's busy state and the result column all flip on the same tick.
 *
 * `onSettle` must be stable (a setter or a `useCallback`) — `start` is
 * memoised on it, and a fresh closure every render would rebuild the run.
 *
 * Under `prefers-reduced-motion` (and for `Insert solution`, which is an
 * escape hatch, not a demo) the run settles immediately — the animation is
 * never the only way to reach the result.
 */
export function useStagedCheckRun(
  onSettle: (result: ValidationResult) => void,
): StagedCheckRun {
  const [run, setRun] = useState<CheckRunProgress | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) {
      clearTimeout(timer);
    }
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const cancel = useCallback(() => {
    clearTimers();
    setRun(null);
  }, [clearTimers]);

  const start = useCallback<StagedCheckRun["start"]>(
    (result, meta, options) => {
      clearTimers();

      if (options?.instant || prefersReducedMotion()) {
        setRun(null);
        onSettle(result);
        return;
      }

      setRun({
        step: 0,
        fileName: meta.fileName,
        checkCount: result.checks.length,
        willPass: result.passed,
      });

      for (let step = 1; step <= CHECK_RUN_STEPS.length; step += 1) {
        timers.current.push(
          setTimeout(
            () => setRun((current) => (current ? { ...current, step } : null)),
            step * STEP_MS,
          ),
        );
      }

      timers.current.push(
        setTimeout(
          () => {
            setRun(null);
            onSettle(result);
          },
          CHECK_RUN_STEPS.length * STEP_MS + SETTLE_MS,
        ),
      );
    },
    [clearTimers, onSettle],
  );

  return { run, start, cancel };
}
