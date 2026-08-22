import { typescriptLanguage } from "@codemirror/lang-javascript";
import type { SyntaxNode } from "@lezer/common";
import {
  buildNoLeakChecks,
  buildTransformationChecks,
  type Task4Tokens,
} from "../task4Checks";
import { child, children, findAll, textOf } from "../lezerUtils";
import { TASK4_FIELDS } from "../task4";
import { TASK4_STARTER_CODE } from "../task4StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";

const TOKENS: Task4Tokens = { date: "toISOString" };

const SOLUTION_EDITABLE = `    userName: user.userName,
    displayName: \`\${user.firstName} \${user.lastName}\`,
    birthDate: user.birthDate.toISOString().slice(0, 10),
    email: user.email,
`;

function extractFieldExpressions(doc: string): {
  container: SyntaxNode | null;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = typescriptLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK4_FIELDS) {
    fields[field.outputName] = null;
  }

  const returnStatement = findAll(tree.topNode, "ReturnStatement")[0];
  const objectExpression = returnStatement
    ? child(returnStatement, "ObjectExpression")
    : null;
  if (!objectExpression) {
    return { container: null, fields };
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

  return { container: objectExpression, fields };
}

function validate(doc: string) {
  const { container, fields } = extractFieldExpressions(doc);

  const declaredCheck = {
    id: "construct",
    passed: container !== null,
    message: container
      ? "mapUserResponse returns an object."
      : "mapUserResponse should return an object literal.",
  };

  const checks = [
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ];
  if (container) {
    checks.push(...buildNoLeakChecks(container, doc));
  }
  return toResult(checks);
}

export const typescriptResponseMapperAdapter: TaskLanguageAdapter = {
  language: "typescript",
  fileName: "mapUserResponse.ts",
  starterCode: TASK4_STARTER_CODE.typescript,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(
    TASK4_STARTER_CODE.typescript,
    SOLUTION_EDITABLE,
  ),
  hints: [
    {
      kind: "concept",
      text: "The public response contains only what a client needs — building it explicitly means passwordHash and internalNote can never leak by accident.",
    },
    {
      kind: "fields",
      text: "Carry over userName and email as-is, combine user.firstName and user.lastName into displayName, and format user.birthDate as YYYY-MM-DD.",
    },
    {
      kind: "syntax",
      text: "Use a template literal for displayName and toISOString().slice(0, 10) for the date format.",
      code: "displayName: `${user.firstName} ${user.lastName}`,",
    },
  ],
  validate,
};
