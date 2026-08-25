import { TASK1_REQUIRED_FIELDS, type RequiredFieldKind } from "./task1";
import { activeMessages } from "@/lib/i18n/catalogue";
import type { ValidationCheck, ValidationResult } from "./types";

export type FoundField = { name: string; typeText: string; readonly: boolean };

function kindLabel(kind: RequiredFieldKind): string {
  const { checks } = activeMessages();
  return kind === "date" ? checks.kindDate : checks.kindString;
}

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
  const { checks } = activeMessages();

  return TASK1_REQUIRED_FIELDS.map(({ name, kind }) => {
    const found = foundFields.find((f) => f.name === name);
    if (!found) {
      return {
        id: `field-${name}`,
        passed: false,
        message: checks.fieldMissingRequest(name),
      };
    }
    if (!isTypeAcceptable(kind, found.typeText)) {
      return {
        id: `field-${name}`,
        passed: false,
        message: checks.fieldWrongType(name, kindLabel(kind), found.typeText),
      };
    }
    return {
      id: `field-${name}`,
      passed: true,
      message: checks.fieldDeclared(name),
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
  const { checks } = activeMessages();
  const relevant = TASK1_REQUIRED_FIELDS.map(({ name }) =>
    foundFields.find((f) => f.name === name),
  ).filter((f): f is FoundField => f !== undefined);

  if (relevant.length === 0) {
    return {
      id: "immutable",
      passed: false,
      message: checks.immutableUnknown,
    };
  }

  const mutable = relevant.filter((f) => !f.readonly);
  if (mutable.length > 0) {
    return {
      id: "immutable",
      passed: false,
      message: checks.immutableMissing(mutable.map((f) => f.name).join(", ")),
    };
  }

  return {
    id: "immutable",
    passed: true,
    message: checks.immutableAll,
  };
}

export function toResult(results: ValidationCheck[]): ValidationResult {
  return {
    passed: results.every((check) => check.passed),
    checks: results,
  };
}
