import { phpLanguage } from "@codemirror/lang-php";
import type { SyntaxNode } from "@lezer/common";
import { buildTransformationChecks, type Task3Tokens } from "../task3Checks";
import { child, children, findAll, textOf } from "../lezerUtils";
import { TASK3_FIELDS } from "../task3";
import { TASK3_STARTER_CODE } from "../task3StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";

const TOKENS: Task3Tokens = {
  integer: "intval",
  verifiedLiteral: "VERIFIED",
  date: "DateTimeImmutable",
};

const SOLUTION_EDITABLE = `            userId: intval($raw['subject_id']),
            verified: $raw['verification_state'] === 'VERIFIED',
            checkedAt: new \\DateTimeImmutable($raw['checked_at']),
`;

function extractFieldExpressions(doc: string): {
  found: boolean;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = phpLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK3_FIELDS) {
    fields[field.outputName] = null;
  }

  const newExpression = findAll(tree.topNode, "NewExpression").find((n) => {
    const nameNode = child(n, "Name");
    return nameNode && textOf(nameNode, doc) === "IdentityCheckResult";
  });
  const argList = newExpression ? child(newExpression, "ArgList") : null;
  if (!argList) {
    return { found: false, fields };
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

  return { found: true, fields };
}

function validate(doc: string) {
  const { found, fields } = extractFieldExpressions(doc);

  const declaredCheck = {
    id: "construct",
    passed: found,
    message: found
      ? "map() returns a new IdentityCheckResult with named arguments."
      : "map() should return new IdentityCheckResult(...) using named arguments.",
  };

  return toResult([
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ]);
}

export const phpIdentityMapperAdapter: TaskLanguageAdapter = {
  language: "php",
  fileName: "IdentityCheckResultMapper.php",
  starterCode: TASK3_STARTER_CODE.php,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK3_STARTER_CODE.php, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The Identity Service's response is a foreign contract with its own field names and representations — the mapper is the one place that isolates it.",
    },
    {
      kind: "fields",
      text: "Convert $raw['subject_id'] to an int, compare $raw['verification_state'] against 'VERIFIED' to get a bool, and convert $raw['checked_at'] into a real DateTimeImmutable.",
    },
    {
      kind: "syntax",
      text: "Use intval() for the number, a strict comparison for the boolean, and new DateTimeImmutable(...) for the timestamp.",
      code: "userId: intval($raw['subject_id']),",
    },
  ],
  validate,
};
