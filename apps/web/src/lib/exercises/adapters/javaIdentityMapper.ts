import { javaLanguage } from "@codemirror/lang-java";
import type { SyntaxNode } from "@lezer/common";
import { buildTransformationChecks, type Task3Tokens } from "../task3Checks";
import { child, findAll, textOf } from "../lezerUtils";
import { TASK3_FIELDS } from "../task3";
import { TASK3_STARTER_CODE } from "../task3StarterCode";
import { composeSolution } from "../composeSolution";
import { toResult } from "../checks";
import type { TaskLanguageAdapter } from "../types";
import { activeMessages } from "@/lib/i18n/catalogue";

const TOKENS: Task3Tokens = {
  integer: "parseInt",
  verifiedLiteral: "VERIFIED",
  date: "parse",
};

const SOLUTION_EDITABLE = `            Integer.parseInt(raw.get("subject_id")),
            raw.get("verification_state").equals("VERIFIED"),
            Instant.parse(raw.get("checked_at"))
`;

const PUNCTUATION = new Set(["(", ")", ","]);

/**
 * Java has no named constructor arguments, so — like the Task 2 mapper —
 * fields are matched by position, in the same order Task 3's record
 * declares its components (spec section 6.3).
 */
function extractFieldExpressions(doc: string): {
  found: boolean;
  fields: Record<string, SyntaxNode | null>;
} {
  const tree = javaLanguage.parser.parse(doc);
  const fields: Record<string, SyntaxNode | null> = {};
  for (const field of TASK3_FIELDS) {
    fields[field.outputName] = null;
  }

  const creation = findAll(tree.topNode, "ObjectCreationExpression").find(
    (n) => {
      const typeName = child(n, "TypeName");
      return typeName && textOf(typeName, doc) === "IdentityCheckResult";
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

  TASK3_FIELDS.forEach((field, index) => {
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
      ? activeMessages().construct["external-api"].java.ok
      : activeMessages().construct["external-api"].java.missing,
  };

  return toResult([
    declaredCheck,
    ...buildTransformationChecks(fields, doc, TOKENS),
  ]);
}

export const javaIdentityMapperAdapter: TaskLanguageAdapter = {
  language: "java",
  fileName: "IdentityCheckResultMapper.java",
  starterCode: TASK3_STARTER_CODE.java,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK3_STARTER_CODE.java, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "The Identity Service's response is a foreign contract with its own field names and representations — the mapper is the one place that isolates it.",
    },
    {
      kind: "fields",
      text: 'Convert raw.get("subject_id") to an int, compare raw.get("verification_state") against "VERIFIED" to get a boolean, and convert raw.get("checked_at") into a real Instant — arguments are positional, in the same order as the record.',
    },
    {
      kind: "syntax",
      text: "Use Integer.parseInt for the number, .equals(...) for the boolean, and Instant.parse for the timestamp.",
      code: 'Integer.parseInt(raw.get("subject_id")),',
    },
  ],
  validate,
};
