import { javaLanguage } from "@codemirror/lang-java";
import type { SyntaxNode } from "@lezer/common";
import { buildTransformationChecks, type Task2Tokens } from "../task2Checks";
import { child, findAll, textOf } from "../lezerUtils";
import { TASK2_FIELDS } from "../task2";
import { TASK2_STARTER_CODE } from "../task2StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";
import { activeMessages } from "@/lib/i18n/catalogue";

const TOKENS: Task2Tokens = {
  trim: "trim",
  lowercase: "toLowerCase",
  date: "parse",
};

const SOLUTION_EDITABLE = `            form.get("user_name").trim().toLowerCase(),
            form.get("first_name").trim(),
            form.get("last_name").trim(),
            LocalDate.parse(form.get("birth_date").trim()),
            form.get("email").trim().toLowerCase()
`;

const PUNCTUATION = new Set(["(", ")", ","]);

/**
 * Java has no named constructor arguments, so — unlike the other three
 * tracks — fields are matched by position, in the same order Task 1's
 * record declares its components (spec section 6.1).
 */
function extractFieldExpressions(doc: string): {
  found: boolean;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = javaLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK2_FIELDS) {
    fields[field.outputName] = null;
  }

  const creation = findAll(tree.topNode, "ObjectCreationExpression").find(
    (n) => {
      const typeName = child(n, "TypeName");
      return typeName && textOf(typeName, doc) === "CreateUserRequest";
    },
  );
  const argumentList = creation ? child(creation, "ArgumentList") : null;
  if (!argumentList) {
    return { found: false, fields };
  }

  const positionalArgs: SyntaxNode[] = [];
  let node = argumentList.firstChild;
  while (node) {
    if (!PUNCTUATION.has(node.name)) {
      positionalArgs.push(node);
    }
    node = node.nextSibling;
  }

  TASK2_FIELDS.forEach((field, index) => {
    fields[field.outputName] = positionalArgs[index] ?? null;
  });

  return { found: true, fields };
}

function validate(doc: string) {
  const { found, fields } = extractFieldExpressions(doc);

  const declaredCheck = {
    id: "construct",
    passed: found,
    message: found
      ? activeMessages().construct["request-mapper"].java.ok
      : activeMessages().construct["request-mapper"].java.missing,
  };

  return toResult([
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ]);
}

export const javaMapperAdapter: TaskLanguageAdapter = {
  language: "java",
  fileName: "CreateUserRequestMapper.java",
  starterCode: TASK2_STARTER_CODE.java,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK2_STARTER_CODE.java, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The mapper is the one place that translates a foreign shape (snake_case, stray whitespace) into your application's own typed contract.",
    },
    {
      kind: "fields",
      text: 'Read each form.get("...") field, trim it, and for userName/email also lowercase it. Convert birth_date into a real LocalDate — arguments are positional, in the same order as the record.',
    },
    {
      kind: "syntax",
      text: "Chain .trim() and .toLowerCase() directly on the map lookup.",
      code: 'form.get("user_name").trim().toLowerCase(),',
    },
  ],
  validate,
};
