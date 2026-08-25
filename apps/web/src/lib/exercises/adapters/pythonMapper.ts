import { pythonLanguage } from "@codemirror/lang-python";
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
  trim: "strip",
  lowercase: "lower",
  date: "fromisoformat",
};

const SOLUTION_EDITABLE = `            userName=raw["user_name"].strip().lower(),
            firstName=raw["first_name"].strip(),
            lastName=raw["last_name"].strip(),
            birthDate=date.fromisoformat(raw["birth_date"].strip()),
            email=raw["email"].strip().lower(),
`;

function extractFieldExpressions(doc: string): {
  found: boolean;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = pythonLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK2_FIELDS) {
    fields[field.outputName] = null;
  }

  const call = findAll(tree.topNode, "CallExpression").find((n) => {
    const callee = n.firstChild;
    return (
      callee?.name === "VariableName" &&
      textOf(callee, doc) === "CreateUserRequest"
    );
  });
  const argList = call ? child(call, "ArgList") : null;
  if (!argList) {
    return { found: false, fields };
  }

  // Keyword arguments (name=value) appear as VariableName, AssignOp, <value> in sequence.
  let node = argList.firstChild;
  while (node) {
    if (node.name === "VariableName") {
      const name = textOf(node, doc);
      const assignOp = node.nextSibling;
      const valueNode =
        assignOp?.name === "AssignOp" ? assignOp.nextSibling : null;
      if (name in fields && valueNode) {
        fields[name] = valueNode;
      }
    }
    node = node.nextSibling;
  }

  return { found: true, fields };
}

function validate(doc: string) {
  const { found, fields } = extractFieldExpressions(doc);

  const declaredCheck = {
    id: "construct",
    passed: found,
    message: found
      ? activeMessages().construct["request-mapper"].python.ok
      : activeMessages().construct["request-mapper"].python.missing,
  };

  return toResult([
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ]);
}

export const pythonMapperAdapter: TaskLanguageAdapter = {
  language: "python",
  fileName: "create_user_request_mapper.py",
  starterCode: TASK2_STARTER_CODE.python,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK2_STARTER_CODE.python, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The mapper is the one place that translates a foreign shape (snake_case, stray whitespace) into your application's own typed contract.",
    },
    {
      kind: "fields",
      text: 'Read each raw["..."] field, strip it, and for userName/email also lowercase it. Convert birth_date into a real date.',
    },
    {
      kind: "syntax",
      text: "Chain .strip() and .lower() directly on the raw field access.",
      code: 'userName=raw["user_name"].strip().lower(),',
    },
  ],
  validate,
};
