import { phpLanguage } from "@codemirror/lang-php";
import type { SyntaxNode } from "@lezer/common";
import { buildTransformationChecks, type Task2Tokens } from "../task2Checks";
import { child, children, findAll, textOf } from "../lezerUtils";
import { TASK2_FIELDS } from "../task2";
import { TASK2_STARTER_CODE } from "../task2StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";
import { activeMessages } from "@/lib/i18n/catalogue";

const TOKENS: Task2Tokens = {
  trim: "trim",
  lowercase: "strtolower",
  date: "DateTimeImmutable",
};

const SOLUTION_EDITABLE = `            userName: strtolower(trim($raw['user_name'])),
            firstName: trim($raw['first_name']),
            lastName: trim($raw['last_name']),
            birthDate: new \\DateTimeImmutable(trim($raw['birth_date'])),
            email: strtolower(trim($raw['email'])),
`;

function extractFieldExpressions(doc: string): {
  found: boolean;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = phpLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK2_FIELDS) {
    fields[field.outputName] = null;
  }

  const newExpression = findAll(tree.topNode, "NewExpression").find((n) => {
    const nameNode = child(n, "Name");
    return nameNode && textOf(nameNode, doc) === "CreateUserRequest";
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
      ? activeMessages().construct["request-mapper"].php.ok
      : activeMessages().construct["request-mapper"].php.missing,
  };

  return toResult([
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ]);
}

export const phpMapperAdapter: TaskLanguageAdapter = {
  language: "php",
  fileName: "CreateUserRequestMapper.php",
  starterCode: TASK2_STARTER_CODE.php,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK2_STARTER_CODE.php, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The mapper is the one place that translates a foreign shape (snake_case, stray whitespace) into your application's own typed contract.",
    },
    {
      kind: "fields",
      text: "Read each $raw['...'] field, trim it, and for userName/email also lowercase it. Convert birth_date into a real DateTimeImmutable.",
    },
    {
      kind: "syntax",
      text: "Use PHP's named arguments and wrap trim() with strtolower() where needed.",
      code: "userName: strtolower(trim($raw['user_name'])),",
    },
  ],
  validate,
};
