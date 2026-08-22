import type { SyntaxNode } from "@lezer/common";
import { subtreeContainsToken } from "./lezerUtils";
import { TASK3_FIELDS } from "./task3";
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
  return TASK3_FIELDS.flatMap((field): ValidationCheck[] => {
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

    if (field.kind === "integer") {
      const hasInt = subtreeContainsToken(expr, doc, tokens.integer);
      checks.push({
        id: `field-${field.outputName}-integer`,
        passed: hasInt,
        message: hasInt
          ? `${field.outputName} is converted to an integer.`
          : `${field.outputName} is still text instead of an integer.`,
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
          ? `${field.outputName} compares against "VERIFIED".`
          : `${field.outputName} should compare verification_state against "VERIFIED".`,
      });
    }

    if (field.kind === "date") {
      const hasDate = subtreeContainsToken(expr, doc, tokens.date);
      checks.push({
        id: `field-${field.outputName}-date`,
        passed: hasDate,
        message: hasDate
          ? `${field.outputName} is converted to a timestamp type.`
          : `${field.outputName} is still text instead of a timestamp.`,
      });
    }

    return checks;
  });
}
