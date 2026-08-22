import { typescriptLanguage } from "@codemirror/lang-javascript";
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

const SOLUTION_EDITABLE = `  readonly userName: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: Date;
  readonly email: string;
`;

const ACCEPTED_TYPES: Record<RequiredFieldKind, string[]> = {
  string: ["string"],
  date: ["Date"],
};

function isTypeAcceptable(kind: RequiredFieldKind, typeText: string): boolean {
  return ACCEPTED_TYPES[kind].includes(typeText.trim());
}

/** Extracts fields from `type CreateUserRequest = { readonly x: T; ... }`. */
function fieldsFromObjectType(
  objectType: SyntaxNode,
  doc: string,
): FoundField[] {
  return children(objectType, "PropertyType").flatMap((prop) => {
    const def = child(prop, "PropertyDefinition");
    const annotation = child(prop, "TypeAnnotation");
    const typeName = annotation ? child(annotation, "TypeName") : null;
    if (!def || !typeName) {
      return [];
    }
    const isReadonly = prop.firstChild?.name === "readonly";
    return [
      {
        name: textOf(def, doc),
        typeText: textOf(typeName, doc),
        readonly: isReadonly,
      },
    ];
  });
}

/** Extracts fields from a class using constructor parameter-property promotion. */
function fieldsFromClass(classDecl: SyntaxNode, doc: string): FoundField[] {
  const paramList = findAll(classDecl, "ParamList")[0];
  if (!paramList) {
    return [];
  }

  const found: FoundField[] = [];
  let node = paramList.firstChild;
  let pendingReadonly = false;
  while (node) {
    if (node.name === "readonly") {
      pendingReadonly = true;
    } else if (node.name === "VariableDefinition") {
      const annotation = node.nextSibling;
      const typeName =
        annotation?.name === "TypeAnnotation"
          ? child(annotation, "TypeName")
          : null;
      if (typeName) {
        found.push({
          name: textOf(node, doc),
          typeText: textOf(typeName, doc),
          readonly: pendingReadonly,
        });
      }
      pendingReadonly = false;
    } else if (node.name === ",") {
      pendingReadonly = false;
    }
    node = node.nextSibling;
  }
  return found;
}

function validate(doc: string) {
  const tree = typescriptLanguage.parser.parse(doc);

  const typeAlias = findAll(tree.topNode, "TypeAliasDeclaration").find(
    (n) =>
      child(n, "TypeDefinition") &&
      textOf(child(n, "TypeDefinition")!, doc) === "CreateUserRequest",
  );
  const classDecl = findAll(tree.topNode, "ClassDeclaration").find(
    (n) =>
      child(n, "VariableDefinition") &&
      textOf(child(n, "VariableDefinition")!, doc) === "CreateUserRequest",
  );

  let foundFields: FoundField[] = [];
  if (typeAlias) {
    const objectType = child(typeAlias, "ObjectType");
    foundFields = objectType ? fieldsFromObjectType(objectType, doc) : [];
  } else if (classDecl) {
    foundFields = fieldsFromClass(classDecl, doc);
  }

  const declaredCheck = {
    id: "construct",
    passed: Boolean(typeAlias || classDecl),
    message:
      typeAlias || classDecl
        ? "CreateUserRequest is declared."
        : "No CreateUserRequest type or class was found.",
  };

  return toResult([
    declaredCheck,
    ...buildFieldChecks(foundFields, isTypeAcceptable),
    buildImmutabilityCheck(foundFields),
  ]);
}

export const typescriptAdapter: TaskLanguageAdapter = {
  language: "typescript",
  fileName: "CreateUserRequest.ts",
  starterCode: TASK1_STARTER_CODE.typescript,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(
    TASK1_STARTER_CODE.typescript,
    SOLUTION_EDITABLE,
  ),
  hints: [
    {
      kind: "concept",
      text: "A request DTO makes the input contract explicit and prevents it from being changed after creation.",
    },
    {
      kind: "fields",
      text: "You need userName, firstName, lastName, birthDate, and email — all typed and all readonly.",
    },
    {
      kind: "syntax",
      text: "In TypeScript, mark each property readonly inside an object type.",
      code: "readonly userName: string;",
    },
  ],
  validate,
};
