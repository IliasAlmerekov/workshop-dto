import { pythonLanguage } from "@codemirror/lang-python";
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

const TOKENS: Task4Tokens = { date: "strftime" };

const SOLUTION_EDITABLE = `            userName=user.userName,
            displayName=f"{user.firstName} {user.lastName}",
            birthDate=user.birthDate.strftime("%Y-%m-%d"),
            email=user.email,
`;

function extractFieldExpressions(doc: string): {
  container: SyntaxNode | null;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = pythonLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK4_FIELDS) {
    fields[field.outputName] = null;
  }

  const call = findAll(tree.topNode, "CallExpression").find((n) => {
    const callee = n.firstChild;
    return (
      callee?.name === "VariableName" && textOf(callee, doc) === "UserResponse"
    );
  });
  const argList = call ? child(call, "ArgList") : null;
  if (!argList) {
    return { container: null, fields };
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

  return { container: argList, fields };
}

function validate(doc: string) {
  const { container, fields } = extractFieldExpressions(doc);

  const declaredCheck = {
    id: "construct",
    passed: container !== null,
    message: container
      ? "map() returns UserResponse with keyword arguments."
      : "map() should return UserResponse(...) using keyword arguments.",
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

export const pythonResponseMapperAdapter: TaskLanguageAdapter = {
  language: "python",
  fileName: "user_response_mapper.py",
  starterCode: TASK4_STARTER_CODE.python,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK4_STARTER_CODE.python, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The public response contains only what a client needs — building it explicitly means passwordHash and internalNote can never leak by accident.",
    },
    {
      kind: "fields",
      text: "Carry over user.userName and user.email as-is, combine user.firstName and user.lastName into displayName, and format user.birthDate as YYYY-MM-DD.",
    },
    {
      kind: "syntax",
      text: "Use an f-string for displayName and .strftime(...) for the date.",
      code: 'displayName=f"{user.firstName} {user.lastName}",',
    },
  ],
  validate,
};
