import type { SyntaxNode } from "@lezer/common";
import { subtreeContainsToken } from "./lezerUtils";
import { TASK2_FIELDS } from "./task2";
import { activeMessages } from "@/lib/i18n/catalogue";
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
  const { checks: text } = activeMessages();

  return TASK2_FIELDS.flatMap((field): ValidationCheck[] => {
    const expr = fieldExpressions[field.outputName];
    if (!expr) {
      return [
        {
          id: `field-${field.outputName}`,
          passed: false,
          message: text.missingFromResult(field.outputName),
        },
      ];
    }

    const hasSource = subtreeContainsToken(expr, doc, field.sourceKey);
    const checks: ValidationCheck[] = [
      {
        id: `field-${field.outputName}-source`,
        passed: hasSource,
        message: hasSource
          ? text.readsFrom(field.outputName, field.sourceKey)
          : text.shouldReadFrom(field.outputName, field.sourceKey),
      },
    ];

    const hasTrim = subtreeContainsToken(expr, doc, tokens.trim);
    checks.push({
      id: `field-${field.outputName}-trim`,
      passed: hasTrim,
      message: hasTrim
        ? text.trims(field.outputName)
        : text.shouldTrim(field.outputName),
    });

    if (field.needsLowercase) {
      const hasLowercase = subtreeContainsToken(expr, doc, tokens.lowercase);
      checks.push({
        id: `field-${field.outputName}-lowercase`,
        passed: hasLowercase,
        message: hasLowercase
          ? text.lowercased(field.outputName)
          : text.shouldLowercase(field.outputName),
      });
    }

    if (field.isDate) {
      const hasDate = subtreeContainsToken(expr, doc, tokens.date);
      checks.push({
        id: `field-${field.outputName}-date`,
        passed: hasDate,
        message: hasDate
          ? text.isDate(field.outputName)
          : text.shouldBeDate(field.outputName),
      });
    }

    return checks;
  });
}
