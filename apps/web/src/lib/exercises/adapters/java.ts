import { javaLanguage } from "@codemirror/lang-java";
import type { SyntaxNode } from "@lezer/common";
import { buildFieldChecks, toResult, type FoundField } from "../checks";
import { child, findAll, textOf } from "../lezerUtils";
import type { RequiredFieldKind } from "../task1";
import { TASK1_STARTER_CODE, composeSolution } from "../task1StarterCode";
import type { TaskLanguageAdapter } from "../types";
import { activeMessages } from "@/lib/i18n/catalogue";

const SOLUTION_EDITABLE = `    String userName,
    String firstName,
    String lastName,
    LocalDate birthDate,
    String email
`;

const ACCEPTED_TYPES: Record<RequiredFieldKind, string[]> = {
  string: ["String"],
  date: ["LocalDate"],
};

function isTypeAcceptable(kind: RequiredFieldKind, typeText: string): boolean {
  return ACCEPTED_TYPES[kind].includes(typeText.trim());
}

/**
 * @codemirror/lang-java's grammar predates Java 16 record declarations
 * (verified against the real parser output): `record CreateUserRequest(...)`
 * is misparsed as a LocalVariableDeclaration of type "record" named
 * CreateUserRequest, followed by an ExpressionStatement whose
 * LambdaExpression happens to have the same shape as the component list
 * (FormalParameters of TypeName + Definition pairs). That shape is stable
 * and exactly what we need, so we read it deliberately rather than working
 * around it with text matching. A plain `class` produces a structurally
 * different ClassDeclaration, so this can't be confused with one.
 */
function findRecordComponents(
  topNode: SyntaxNode,
  doc: string,
): SyntaxNode | null {
  const declaration = findAll(topNode, "LocalVariableDeclaration").find((n) => {
    const typeName = child(n, "TypeName");
    const declarator = child(n, "VariableDeclarator");
    const name = declarator ? child(declarator, "Definition") : null;
    return (
      typeName &&
      textOf(typeName, doc) === "record" &&
      name &&
      textOf(name, doc) === "CreateUserRequest"
    );
  });
  if (!declaration) {
    return null;
  }

  const expressionStatement = declaration.nextSibling;
  if (expressionStatement?.name !== "ExpressionStatement") {
    return null;
  }
  const lambda = child(expressionStatement, "LambdaExpression");
  return lambda ? child(lambda, "FormalParameters") : null;
}

function fieldsFromComponents(
  formalParameters: SyntaxNode,
  doc: string,
): FoundField[] {
  return findAll(formalParameters, "FormalParameter").flatMap((param) => {
    const typeName = child(param, "TypeName");
    const def = child(param, "Definition");
    if (!typeName || !def) {
      return [];
    }
    // Record components are implicitly private and final — there is no
    // separate immutability modifier to check per field.
    return [
      {
        name: textOf(def, doc),
        typeText: textOf(typeName, doc),
        readonly: true,
      },
    ];
  });
}

function validate(doc: string) {
  const tree = javaLanguage.parser.parse(doc);
  const components = findRecordComponents(tree.topNode, doc);
  const foundFields = components ? fieldsFromComponents(components, doc) : [];

  const declaredCheck = {
    id: "construct",
    passed: components !== null,
    message:
      components !== null
        ? activeMessages().construct["request-dto"].java.ok
        : activeMessages().construct["request-dto"].java.missing,
  };

  return toResult([
    declaredCheck,
    ...buildFieldChecks(foundFields, isTypeAcceptable),
  ]);
}

export const javaAdapter: TaskLanguageAdapter = {
  language: "java",
  fileName: "CreateUserRequest.java",
  starterCode: TASK1_STARTER_CODE.java,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK1_STARTER_CODE.java, SOLUTION_EDITABLE),
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
      text: "A record's components are implicitly immutable — just list them, comma-separated.",
      code: "String userName,",
    },
  ],
  validate,
};
