import { TASK1_REQUIRED_FIELDS, type RequiredFieldKind } from "./task1";
import type { ValidationCheck, ValidationResult } from "./types";

export type FoundField = { name: string; typeText: string; readonly: boolean };

const KIND_LABEL: Record<RequiredFieldKind, string> = {
  string: "a string",
  date: "a date type",
};

/**
 * Builds the five per-field checks shared by every language adapter. Each
 * language supplies what it actually found in the syntax tree and its own
 * rule for whether a given type spelling counts as "string" or "date" —
 * the field names and the fact that five specific fields are required is
 * the one language-neutral rule (spec section 6.1).
 */
export function buildFieldChecks(
  foundFields: FoundField[],
  isTypeAcceptable: (kind: RequiredFieldKind, typeText: string) => boolean,
): ValidationCheck[] {
  return TASK1_REQUIRED_FIELDS.map(({ name, kind }) => {
    const found = foundFields.find((f) => f.name === name);
    if (!found) {
      return {
        id: `field-${name}`,
        passed: false,
        message: `${name} is missing from the request.`,
      };
    }
    if (!isTypeAcceptable(kind, found.typeText)) {
      return {
        id: `field-${name}`,
        passed: false,
        message: `${name} should be ${KIND_LABEL[kind]}, not "${found.typeText}".`,
      };
    }
    return {
      id: `field-${name}`,
      passed: true,
      message: `${name} is declared correctly.`,
    };
  });
}

/**
 * A single overall immutability check across the required fields that were
 * actually found. Kept separate from the per-field checks so the feedback
 * distinguishes "wrong shape" from "right shape, but not immutable".
 */
export function buildImmutabilityCheck(
  foundFields: FoundField[],
): ValidationCheck {
  const relevant = TASK1_REQUIRED_FIELDS.map(({ name }) =>
    foundFields.find((f) => f.name === name),
  ).filter((f): f is FoundField => f !== undefined);

  if (relevant.length === 0) {
    return {
      id: "immutable",
      passed: false,
      message: "No fields were found yet, so immutability can't be checked.",
    };
  }

  const mutable = relevant.filter((f) => !f.readonly);
  if (mutable.length > 0) {
    return {
      id: "immutable",
      passed: false,
      message: `${mutable.map((f) => f.name).join(", ")} must be immutable.`,
    };
  }

  return {
    id: "immutable",
    passed: true,
    message: "All fields are immutable.",
  };
}

export function toResult(checks: ValidationCheck[]): ValidationResult {
  return { passed: checks.every((check) => check.passed), checks };
}
