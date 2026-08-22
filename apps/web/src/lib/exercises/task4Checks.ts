import type { SyntaxNode } from "@lezer/common";
import { subtreeContainsToken } from "./lezerUtils";
import { TASK4_FIELDS, TASK4_FORBIDDEN_FIELDS } from "./task4";
import type { ValidationCheck } from "./types";

export type Task4Tokens = { date: string };

export function buildTransformationChecks(
  fieldExpressions: Record<string, SyntaxNode | null>,
  doc: string,
  tokens: Task4Tokens,
): ValidationCheck[] {
  return TASK4_FIELDS.flatMap((field): ValidationCheck[] => {
    const expr = fieldExpressions[field.outputName];
    if (!expr) {
      return [
        {
          id: `field-${field.outputName}`,
          passed: false,
          message: `${field.outputName} is missing from the mapped response.`,
        },
      ];
    }

    if (field.kind === "passthrough") {
      const hasSource = subtreeContainsToken(expr, doc, field.sourceKey!);
      return [
        {
          id: `field-${field.outputName}-source`,
          passed: hasSource,
          message: hasSource
            ? `${field.outputName} is carried over from the user.`
            : `${field.outputName} should be carried over from the user.`,
        },
      ];
    }

    if (field.kind === "combine") {
      const [firstKey, lastKey] = field.combineKeys!;
      const hasFirst = subtreeContainsToken(expr, doc, firstKey);
      const hasLast = subtreeContainsToken(expr, doc, lastKey);
      return [
        {
          id: `field-${field.outputName}-firstName`,
          passed: hasFirst,
          message: hasFirst
            ? `${field.outputName} includes ${firstKey}.`
            : `${field.outputName} should include ${firstKey}.`,
        },
        {
          id: `field-${field.outputName}-lastName`,
          passed: hasLast,
          message: hasLast
            ? `${field.outputName} includes ${lastKey}.`
            : `${field.outputName} should include ${lastKey}.`,
        },
      ];
    }

    // field.kind === "format"
    const hasSource = subtreeContainsToken(expr, doc, field.sourceKey!);
    const hasFormat = subtreeContainsToken(expr, doc, tokens.date);
    return [
      {
        id: `field-${field.outputName}-source`,
        passed: hasSource,
        message: hasSource
          ? `${field.outputName} reads from the user's ${field.sourceKey}.`
          : `${field.outputName} should read from the user's ${field.sourceKey}.`,
      },
      {
        id: `field-${field.outputName}-format`,
        passed: hasFormat,
        message: hasFormat
          ? `${field.outputName} is formatted as YYYY-MM-DD.`
          : `${field.outputName} is not yet formatted as YYYY-MM-DD.`,
      },
    ];
  });
}

/** Checks that neither forbidden field leaks anywhere into the constructed response (spec 6.4/7.4). */
export function buildNoLeakChecks(
  container: SyntaxNode,
  doc: string,
): ValidationCheck[] {
  return TASK4_FORBIDDEN_FIELDS.map((forbidden) => {
    const leaked = subtreeContainsToken(container, doc, forbidden);
    return {
      id: `no-leak-${forbidden}`,
      passed: !leaked,
      message: leaked
        ? `${forbidden} must not appear in the response.`
        : `${forbidden} is not exposed.`,
    };
  });
}
