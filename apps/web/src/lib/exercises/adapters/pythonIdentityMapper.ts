import { pythonLanguage } from "@codemirror/lang-python";
import type { SyntaxNode } from "@lezer/common";
import { buildTransformationChecks, type Task3Tokens } from "../task3Checks";
import { child, findAll, textOf } from "../lezerUtils";
import { TASK3_FIELDS } from "../task3";
import { TASK3_STARTER_CODE } from "../task3StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";

const TOKENS: Task3Tokens = {
  integer: "int",
  verifiedLiteral: "VERIFIED",
  date: "fromisoformat",
};

const SOLUTION_EDITABLE = `            userId=int(raw["subject_id"]),
            verified=raw["verification_state"] == "VERIFIED",
            checkedAt=datetime.fromisoformat(raw["checked_at"]),
`;

function extractFieldExpressions(doc: string): {
  found: boolean;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = pythonLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK3_FIELDS) {
    fields[field.outputName] = null;
  }

  const call = findAll(tree.topNode, "CallExpression").find((n) => {
    const callee = n.firstChild;
    return (
      callee?.name === "VariableName" &&
      textOf(callee, doc) === "IdentityCheckResult"
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
      ? "map() returns IdentityCheckResult with keyword arguments."
      : "map() should return IdentityCheckResult(...) using keyword arguments.",
  };

  return toResult([
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ]);
}

export const pythonIdentityMapperAdapter: TaskLanguageAdapter = {
  language: "python",
  fileName: "identity_check_result_mapper.py",
  starterCode: TASK3_STARTER_CODE.python,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK3_STARTER_CODE.python, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The Identity Service's response is a foreign contract with its own field names and representations — the mapper is the one place that isolates it.",
    },
    {
      kind: "fields",
      text: 'Convert raw["subject_id"] to an int, compare raw["verification_state"] against "VERIFIED" to get a bool, and convert raw["checked_at"] into a real datetime.',
    },
    {
      kind: "syntax",
      text: "Use int() for the number, an equality comparison for the boolean, and datetime.fromisoformat(...) for the timestamp.",
      code: 'userId=int(raw["subject_id"]),',
    },
  ],
  validate,
};
