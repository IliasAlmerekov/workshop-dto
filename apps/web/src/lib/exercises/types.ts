import type { Language, TaskId } from "@/lib/workshop/types";

/**
 * Validator result shape, per spec section 9.3. Every check carries its own
 * id/message so feedback can point at the specific rule that failed without
 * ever returning the model solution.
 */
export type ValidationCheck = {
  id: string;
  passed: boolean;
  message: string;
};

export type ValidationResult = {
  passed: boolean;
  checks: ValidationCheck[];
};

/**
 * How a task's input is reached from inside the editable region. This is the
 * only thing Completion is allowed to offer: it never describes the target
 * DTO, because completing the target's members would hand over what the
 * staged Hint deliberately withholds until its last card.
 */
export type CompletionInput = {
  /** The variable the starter code binds the input to, e.g. `raw` or `user`. */
  receiver: string;
  /** A keyed collection (array/dict/Map) or an object with named members. */
  shape: "map" | "object";
  /** The input's keys, in the language-neutral spelling the payload uses. */
  members: readonly string[];
};

/** One progressive hint card (spec section 7.3). */
export type HintCard =
  | { kind: "concept"; text: string }
  | { kind: "fields"; text: string }
  | { kind: "syntax"; text: string; code: string };

/**
 * Splits a language adapter's starter code into the fixed prefix/suffix the
 * participant cannot edit and the initial content of the editable TODO
 * region — so the full file is always visible (spec 7.2) while only that
 * region accepts edits.
 */
export type StarterCode = {
  before: string;
  editable: string;
  after: string;
};

/**
 * A language track's half of a task (spec section 13): syntax, starter
 * code, the editable region, hints, the model solution, and the Lezer-based
 * check that validates a participant's edit. The adapter must not redefine
 * what "correct" means — only how to recognize it in this language's grammar.
 */
export type TaskLanguageAdapter = {
  language: Language;
  fileName: string;
  starterCode: StarterCode;
  hints: HintCard[];
  /**
   * Just the editable region's model solution — "Insert solution" replaces
   * the TODO region with this, so it must be exactly what would fill
   * starterCode.editable's position, not a full file participants would
   * need to have that composition re-derived (and risk drifting) at runtime.
   */
  solutionEditable: string;
  /** The complete solution file (starterCode.before + solutionEditable + starterCode.after). */
  solutionCode: string;
  /**
   * Validates a full document (before + participant's edit + after) using
   * that language's Lezer parser. Never executes the code (spec 9.1).
   */
  validate: (document: string) => ValidationResult;
};

/** The language-neutral half of a task (spec section 13). */
export type TaskDefinition = {
  id: TaskId;
  order: number;
  title: string;
  shortTitle: string;
  question: string;
  description: string;
  /** The fields the target construct must declare, shown as chips in the UI. */
  fields: string[];
  estimatedMinutes: number;
  /** Plain-language explanation shown after Insert solution or on success. */
  explanation: string;
  /**
   * Absent when the task reads no input — Task 1 only declares a type, so
   * there is nothing the editor could legitimately complete there.
   */
  completionInput?: CompletionInput;
};
