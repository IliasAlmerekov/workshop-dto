import type { SyntaxNode } from "@lezer/common";
import { subtreeContainsToken } from "./lezerUtils";
import { TASK4_FIELDS, TASK4_FORBIDDEN_FIELDS } from "./task4";
import { activeMessages } from "@/lib/i18n/catalogue";
import type { ValidationCheck } from "./types";

export type Task4Tokens = { date: string };

export function buildTransformationChecks(
  fieldExpressions: Record<string, SyntaxNode | null>,
  doc: string,
  tokens: Task4Tokens,
): ValidationCheck[] {
  const { checks: text } = activeMessages();

  return TASK4_FIELDS.flatMap((field): ValidationCheck[] => {
    const expr = fieldExpressions[field.outputName];
    if (!expr) {
      return [
        {
          id: `field-${field.outputName}`,
          passed: false,
          message: text.missingFromResponse(field.outputName),
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
            ? text.carriedOver(field.outputName)
            : text.shouldCarryOver(field.outputName),
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
            ? text.includes(field.outputName, firstKey)
            : text.shouldInclude(field.outputName, firstKey),
        },
        {
          id: `field-${field.outputName}-lastName`,
          passed: hasLast,
          message: hasLast
            ? text.includes(field.outputName, lastKey)
            : text.shouldInclude(field.outputName, lastKey),
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
          ? text.readsFromUser(field.outputName, field.sourceKey!)
          : text.shouldReadFromUser(field.outputName, field.sourceKey!),
      },
      {
        id: `field-${field.outputName}-format`,
        passed: hasFormat,
        message: hasFormat
          ? text.formatted(field.outputName)
          : text.shouldFormat(field.outputName),
      },
    ];
  });
}

/** Checks that neither forbidden field leaks anywhere into the constructed response (spec 6.4/7.4). */
export function buildNoLeakChecks(
  container: SyntaxNode,
  doc: string,
): ValidationCheck[] {
  const { checks: text } = activeMessages();

  return TASK4_FORBIDDEN_FIELDS.map((forbidden) => {
    const leaked = subtreeContainsToken(container, doc, forbidden);
    return {
      id: `no-leak-${forbidden}`,
      passed: !leaked,
      message: leaked ? text.leaks(forbidden) : text.notExposed(forbidden),
    };
  });
}
