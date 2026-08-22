import type { SyntaxNode } from "@lezer/common";
import { subtreeContainsToken } from "./lezerUtils";
import { TASK2_FIELDS } from "./task2";
import type { ValidationCheck } from "./types";

/** The language-specific method/function names that express each transformation. */
export type Task2Tokens = {
  trim: string;
  lowercase: string;
  date: string;
};

/**
 * Builds the per-field transformation checks shared by every language
 * adapter. A missing field collapses to one "missing" check; a present
 * field is checked for reading the right source key, trimming, and (where
 * relevant) lowercasing or date conversion — each its own check, so
 * feedback names the specific violated rule (spec section 7.4) instead of
 * just "wrong".
 */
export function buildTransformationChecks(
  fieldExpressions: Record<string, SyntaxNode | null>,
  doc: string,
  tokens: Task2Tokens,
): ValidationCheck[] {
  return TASK2_FIELDS.flatMap((field): ValidationCheck[] => {
    const expr = fieldExpressions[field.outputName];
    if (!expr) {
      return [
        {
          id: `field-${field.outputName}`,
          passed: false,
          message: `${field.outputName} is missing from the mapped result.`,
        },
      ];
    }

    const hasSource = subtreeContainsToken(expr, doc, field.sourceKey);
    const checks: ValidationCheck[] = [
      {
        id: `field-${field.outputName}-source`,
        passed: hasSource,
        message: hasSource
          ? `${field.outputName} reads from "${field.sourceKey}".`
          : `${field.outputName} should read from "${field.sourceKey}".`,
      },
    ];

    const hasTrim = subtreeContainsToken(expr, doc, tokens.trim);
    checks.push({
      id: `field-${field.outputName}-trim`,
      passed: hasTrim,
      message: hasTrim
        ? `${field.outputName} trims whitespace.`
        : `${field.outputName} still has untrimmed whitespace.`,
    });

    if (field.needsLowercase) {
      const hasLowercase = subtreeContainsToken(expr, doc, tokens.lowercase);
      checks.push({
        id: `field-${field.outputName}-lowercase`,
        passed: hasLowercase,
        message: hasLowercase
          ? `${field.outputName} is lowercased.`
          : `${field.outputName} should be lowercased.`,
      });
    }

    if (field.isDate) {
      const hasDate = subtreeContainsToken(expr, doc, tokens.date);
      checks.push({
        id: `field-${field.outputName}-date`,
        passed: hasDate,
        message: hasDate
          ? `${field.outputName} is converted to a date type.`
          : `${field.outputName} is still text instead of a date type.`,
      });
    }

    return checks;
  });
}
