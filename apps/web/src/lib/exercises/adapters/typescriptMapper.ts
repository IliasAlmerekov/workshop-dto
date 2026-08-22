import { typescriptLanguage } from "@codemirror/lang-javascript";
import type { SyntaxNode } from "@lezer/common";
import { buildTransformationChecks, type Task2Tokens } from "../task2Checks";
import { child, children, findAll, textOf } from "../lezerUtils";
import { TASK2_FIELDS } from "../task2";
import { TASK2_STARTER_CODE } from "../task2StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";

const TOKENS: Task2Tokens = {
  trim: "trim",
  lowercase: "toLowerCase",
  date: "Date",
};

const SOLUTION_EDITABLE = `    userName: raw.user_name.trim().toLowerCase(),
    firstName: raw.first_name.trim(),
    lastName: raw.last_name.trim(),
    birthDate: new Date(raw.birth_date.trim()),
    email: raw.email.trim().toLowerCase(),
`;

function extractFieldExpressions(doc: string): {
  found: boolean;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = typescriptLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK2_FIELDS) {
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
      ? "mapCreateUserRequest returns an object."
      : "mapCreateUserRequest should return an object literal.",
  };

  return toResult([
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ]);
}

export const typescriptMapperAdapter: TaskLanguageAdapter = {
  language: "typescript",
  fileName: "mapCreateUserRequest.ts",
  starterCode: TASK2_STARTER_CODE.typescript,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(
    TASK2_STARTER_CODE.typescript,
    SOLUTION_EDITABLE,
  ),
  hints: [
    {
      kind: "concept",
      text: "The mapper is the one place that translates a foreign shape (snake_case, stray whitespace) into your application's own typed contract.",
    },
    {
      kind: "fields",
      text: "Read each raw.* field, trim it, and for userName/email also lowercase it. Convert birth_date into a real Date.",
    },
    {
      kind: "syntax",
      text: "Chain the transformations directly on the raw field access.",
      code: "userName: raw.user_name.trim().toLowerCase(),",
    },
  ],
  validate,
};
