import { typescriptLanguage } from "@codemirror/lang-javascript";
import type { SyntaxNode } from "@lezer/common";
import { buildTransformationChecks, type Task3Tokens } from "../task3Checks";
import { child, children, findAll, textOf } from "../lezerUtils";
import { TASK3_FIELDS } from "../task3";
import { TASK3_STARTER_CODE } from "../task3StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";

const TOKENS: Task3Tokens = {
  integer: "parseInt",
  verifiedLiteral: "VERIFIED",
  date: "Date",
};

const SOLUTION_EDITABLE = `    userId: parseInt(raw.subject_id, 10),
    verified: raw.verification_state === "VERIFIED",
    checkedAt: new Date(raw.checked_at),
`;

function extractFieldExpressions(doc: string): {
  found: boolean;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = typescriptLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK3_FIELDS) {
    fields[field.outputName] = null;
  }

  const returnStatement = findAll(tree.topNode, "ReturnStatement")[0];
  const objectExpression = returnStatement
    ? child(returnStatement, "ObjectExpression")
    : null;
  if (!objectExpression) {
    return { found: false, fields };
  }

  for (const property of children(objectExpression, "Property")) {
    const nameNode = child(property, "PropertyDefinition");
    if (!nameNode) {
      continue;
    }
    const name = textOf(nameNode, doc);
    const valueNode = nameNode.nextSibling?.nextSibling ?? null; // skip ":"
    if (name in fields && valueNode) {
      fields[name] = valueNode;
    }
  }

  return { found: true, fields };
}

function validate(doc: string) {
  const { found, fields } = extractFieldExpressions(doc);

  const declaredCheck = {
    id: "construct",
    passed: found,
    message: found
      ? "mapIdentityCheck returns an object."
      : "mapIdentityCheck should return an object literal.",
  };

  return toResult([
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ]);
}

export const typescriptIdentityMapperAdapter: TaskLanguageAdapter = {
  language: "typescript",
  fileName: "mapIdentityCheck.ts",
  starterCode: TASK3_STARTER_CODE.typescript,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(
    TASK3_STARTER_CODE.typescript,
    SOLUTION_EDITABLE,
  ),
  hints: [
    {
      kind: "concept",
      text: "The Identity Service's response is a foreign contract with its own field names and representations — the mapper is the one place that isolates it.",
    },
    {
      kind: "fields",
      text: 'Convert raw.subject_id to a number, compare raw.verification_state against "VERIFIED" to get a boolean, and convert raw.checked_at into a real Date.',
    },
    {
      kind: "syntax",
      text: "Use parseInt for the number, a strict equality comparison for the boolean, and the Date constructor for the timestamp.",
      code: "userId: parseInt(raw.subject_id, 10),",
    },
  ],
  validate,
};
