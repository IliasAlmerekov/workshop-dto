import { javaLanguage } from "@codemirror/lang-java";
import type { SyntaxNode } from "@lezer/common";
import {
  buildNoLeakChecks,
  buildTransformationChecks,
  type Task4Tokens,
} from "../task4Checks";
import { child, findAll, textOf } from "../lezerUtils";
import { TASK4_FIELDS } from "../task4";
import { TASK4_STARTER_CODE } from "../task4StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";
import { activeMessages } from "@/lib/i18n/catalogue";

const TOKENS: Task4Tokens = { date: "format" };

const SOLUTION_EDITABLE = `            user.userName(),
            user.firstName() + " " + user.lastName(),
            user.birthDate().format(DateTimeFormatter.ISO_LOCAL_DATE),
            user.email()
`;

const PUNCTUATION = new Set(["(", ")", ","]);

/**
 * Java has no named constructor arguments, so — like Task 2 and Task 3 —
 * fields are matched by position, in the same order Task 4's UserResponse
 * declares its components (spec section 5.3).
 */
function extractFieldExpressions(doc: string): {
  container: SyntaxNode | null;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = javaLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK4_FIELDS) {
    fields[field.outputName] = null;
  }

  const creation = findAll(tree.topNode, "ObjectCreationExpression").find(
    (n) => {
      const typeName = child(n, "TypeName");
      return typeName && textOf(typeName, doc) === "UserResponse";
    },
  );
  const argumentList = creation ? child(creation, "ArgumentList") : null;
  if (!argumentList) {
    return { container: null, fields };
  }

  const positionalArgs: SyntaxNode[] = [];
  let node = argumentList.firstChild;
  while (node) {
    if (!PUNCTUATION.has(node.name)) {
      positionalArgs.push(node);
    }
    node = node.nextSibling;
  }

  TASK4_FIELDS.forEach((field, index) => {
    fields[field.outputName] = positionalArgs[index] ?? null;
  });

  return { container: argumentList, fields };
}

function validate(doc: string) {
  const { container, fields } = extractFieldExpressions(doc);

  const declaredCheck = {
    id: "construct",
    passed: container !== null,
    message: container
      ? activeMessages().construct["response-dto"].java.ok
      : activeMessages().construct["response-dto"].java.missing,
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

export const javaResponseMapperAdapter: TaskLanguageAdapter = {
  language: "java",
  fileName: "UserResponseMapper.java",
  starterCode: TASK4_STARTER_CODE.java,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK4_STARTER_CODE.java, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The public response contains only what a client needs — building it explicitly means passwordHash and internalNote can never leak by accident.",
    },
    {
      kind: "fields",
      text: "Carry over user.userName() and user.email() as-is, combine user.firstName() and user.lastName() into displayName, and format user.birthDate() as YYYY-MM-DD — arguments are positional, in the same order as the record.",
    },
    {
      kind: "syntax",
      text: "Concatenate strings for displayName and use .format(DateTimeFormatter.ISO_LOCAL_DATE) for the date.",
      code: 'user.firstName() + " " + user.lastName(),',
    },
  ],
  validate,
};
