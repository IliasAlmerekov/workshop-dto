import { phpLanguage } from "@codemirror/lang-php";
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

const TOKENS: Task4Tokens = { date: "format" };

const SOLUTION_EDITABLE = `            userName: $user->userName,
            displayName: trim("{$user->firstName} {$user->lastName}"),
            birthDate: $user->birthDate->format('Y-m-d'),
            email: $user->email,
`;

function extractFieldExpressions(doc: string): {
  container: SyntaxNode | null;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = phpLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK4_FIELDS) {
    fields[field.outputName] = null;
  }

  const newExpression = findAll(tree.topNode, "NewExpression").find((n) => {
    const nameNode = child(n, "Name");
    return nameNode && textOf(nameNode, doc) === "UserResponse";
  });
  const argList = newExpression ? child(newExpression, "ArgList") : null;
  if (!argList) {
    return { container: null, fields };
  }

  for (const argument of children(argList, "NamedArgument")) {
    const nameNode = child(argument, "Name");
    if (!nameNode) {
      continue;
    }
    const name = textOf(nameNode, doc);
    const valueNode = nameNode.nextSibling?.nextSibling ?? null; // skip ":"
    if (name in fields && valueNode) {
      fields[name] = valueNode;
    }
  }

  return { container: argList, fields };
}

function validate(doc: string) {
  const { container, fields } = extractFieldExpressions(doc);

  const declaredCheck = {
    id: "construct",
    passed: container !== null,
    message: container
      ? "map() returns a new UserResponse with named arguments."
      : "map() should return new UserResponse(...) using named arguments.",
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

export const phpResponseMapperAdapter: TaskLanguageAdapter = {
  language: "php",
  fileName: "UserResponseMapper.php",
  starterCode: TASK4_STARTER_CODE.php,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK4_STARTER_CODE.php, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The public response contains only what a client needs — building it explicitly means passwordHash and internalNote can never leak by accident.",
    },
    {
      kind: "fields",
      text: "Carry over $user->userName and $user->email as-is, combine $user->firstName and $user->lastName into displayName, and format $user->birthDate as YYYY-MM-DD.",
    },
    {
      kind: "syntax",
      text: "Use string interpolation for displayName and ->format('Y-m-d') for the date.",
      code: 'displayName: trim("{$user->firstName} {$user->lastName}"),',
    },
  ],
  validate,
};
