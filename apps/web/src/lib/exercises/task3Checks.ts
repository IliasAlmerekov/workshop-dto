import type { SyntaxNode } from "@lezer/common";
import { subtreeContainsToken } from "./lezerUtils";
import { TASK3_FIELDS } from "./task3";
import { activeMessages } from "@/lib/i18n/catalogue";
import type { ValidationCheck } from "./types";

export type Task3Tokens = {
  integer: string;
  verifiedLiteral: string;
  date: string;
};

export function buildTransformationChecks(
  fieldExpressions: Record<string, SyntaxNode | null>,
  doc: string,
  tokens: Task3Tokens,
): ValidationCheck[] {
  const { checks: text } = activeMessages();

  return TASK3_FIELDS.flatMap((field): ValidationCheck[] => {
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

    if (field.kind === "integer") {
      const hasInt = subtreeContainsToken(expr, doc, tokens.integer);
      checks.push({
        id: `field-${field.outputName}-integer`,
        passed: hasInt,
        message: hasInt
          ? text.isInteger(field.outputName)
          : text.shouldBeInteger(field.outputName),
      });
    }

    if (field.kind === "boolean") {
      const hasComparison = subtreeContainsToken(
        expr,
        doc,
        tokens.verifiedLiteral,
      );
      checks.push({
        id: `field-${field.outputName}-comparison`,
        passed: hasComparison,
        message: hasComparison
          ? text.comparesVerified(field.outputName)
          : text.shouldCompareVerified(field.outputName),
      });
    }

    if (field.kind === "date") {
      const hasDate = subtreeContainsToken(expr, doc, tokens.date);
      checks.push({
        id: `field-${field.outputName}-date`,
        passed: hasDate,
        message: hasDate
          ? text.isTimestamp(field.outputName)
          : text.shouldBeTimestamp(field.outputName),
      });
    }

    return checks;
  });
}
