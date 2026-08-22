import { pythonLanguage } from "@codemirror/lang-python";
import type { SyntaxNode } from "@lezer/common";
import {
  buildFieldChecks,
  buildImmutabilityCheck,
  toResult,
  type FoundField,
} from "../checks";
import { child, children, findAll, textOf } from "../lezerUtils";
import type { RequiredFieldKind } from "../task1";
import { TASK1_STARTER_CODE, composeSolution } from "../task1StarterCode";
import type { TaskLanguageAdapter } from "../types";

const SOLUTION_EDITABLE = `    userName: str
    firstName: str
    lastName: str
    birthDate: date
    email: str
`;

const ACCEPTED_TYPES: Record<RequiredFieldKind, string[]> = {
  string: ["str"],
  date: ["date"],
};

function isTypeAcceptable(kind: RequiredFieldKind, typeText: string): boolean {
  return ACCEPTED_TYPES[kind].includes(typeText.trim());
}

function isFrozenDataclassDecorator(
  decorator: SyntaxNode,
  doc: string,
): boolean {
  const callee = decorator.firstChild?.nextSibling; // At, then VariableName
  if (!callee || textOf(callee, doc) !== "dataclass") {
    return false;
  }
  const argList = child(decorator, "ArgList");
  if (!argList) {
    return false;
  }
  let node = argList.firstChild;
  while (node) {
    if (node.name === "VariableName" && textOf(node, doc) === "frozen") {
      const boolNode = node.nextSibling?.nextSibling; // VariableName, AssignOp, Boolean
      if (boolNode?.name === "Boolean" && textOf(boolNode, doc) === "True") {
        return true;
      }
    }
    node = node.nextSibling;
  }
  return false;
}

function fieldsFromBody(
  body: SyntaxNode,
  doc: string,
  isFrozen: boolean,
): FoundField[] {
  return children(body, "AssignStatement").flatMap((stmt) => {
    const nameNode = child(stmt, "VariableName");
    const typeDef = child(stmt, "TypeDef");
    const typeNode = typeDef ? child(typeDef, "VariableName") : null;
    if (!nameNode || !typeNode) {
      return [];
    }
    // A frozen dataclass makes every declared field immutable at the class
    // level — there is no separate per-field modifier, so this mirrors
    // whatever the decorator actually says rather than assuming frozen.
    return [
      {
        name: textOf(nameNode, doc),
        typeText: textOf(typeNode, doc),
        readonly: isFrozen,
      },
    ];
  });
}

function validate(doc: string) {
  const tree = pythonLanguage.parser.parse(doc);

  const decorated = findAll(tree.topNode, "DecoratedStatement").find((n) => {
    const classDef = child(n, "ClassDefinition");
    const nameNode = classDef ? child(classDef, "VariableName") : null;
    return nameNode && textOf(nameNode, doc) === "CreateUserRequest";
  });

  const decorator = decorated ? child(decorated, "Decorator") : null;
  const classDef = decorated ? child(decorated, "ClassDefinition") : null;
  const isFrozen = decorator
    ? isFrozenDataclassDecorator(decorator, doc)
    : false;
  const body = classDef ? child(classDef, "Body") : null;
  const foundFields = body ? fieldsFromBody(body, doc, isFrozen) : [];

  const declaredCheck = {
    id: "construct",
    passed: Boolean(classDef) && isFrozen,
    message: classDef
      ? isFrozen
        ? "CreateUserRequest is a frozen dataclass."
        : "CreateUserRequest should be decorated with @dataclass(frozen=True)."
      : "No CreateUserRequest class was found.",
  };

  return toResult([
    declaredCheck,
    ...buildFieldChecks(foundFields, isTypeAcceptable),
    buildImmutabilityCheck(foundFields),
  ]);
}

export const pythonAdapter: TaskLanguageAdapter = {
  language: "python",
  fileName: "create_user_request.py",
  starterCode: TASK1_STARTER_CODE.python,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK1_STARTER_CODE.python, SOLUTION_EDITABLE),
  hints: [
    {
      kind: "concept",
      text: "A request DTO makes the input contract explicit and prevents it from being changed after creation.",
    },
    {
      kind: "fields",
      text: "You need userName, firstName, lastName, birthDate, and email — all typed.",
    },
    {
      kind: "syntax",
      text: "In a frozen dataclass, every declared attribute is immutable — just annotate the type.",
      code: "userName: str",
    },
  ],
  validate,
};
