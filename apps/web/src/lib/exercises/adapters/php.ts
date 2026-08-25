import { phpLanguage } from "@codemirror/lang-php";
import type { SyntaxNode } from "@lezer/common";
import {
  buildFieldChecks,
  buildImmutabilityCheck,
  toResult,
  type FoundField,
} from "../checks";
import { child, findAll, hasErrorTokenWithText, textOf } from "../lezerUtils";
import type { RequiredFieldKind } from "../task1";
import { TASK1_STARTER_CODE, composeSolution } from "../task1StarterCode";
import type { TaskLanguageAdapter } from "../types";
import { activeMessages } from "@/lib/i18n/catalogue";

const SOLUTION_EDITABLE = `        public string $userName,
        public string $firstName,
        public string $lastName,
        public \\DateTimeImmutable $birthDate,
        public string $email,
`;

const ACCEPTED_TYPES: Record<RequiredFieldKind, string[]> = {
  string: ["string"],
  date: ["DateTimeImmutable", "\\DateTimeImmutable"],
};

function isTypeAcceptable(kind: RequiredFieldKind, typeText: string): boolean {
  return ACCEPTED_TYPES[kind].includes(typeText.trim());
}

/**
 * @codemirror/lang-php's grammar predates PHP 8.1's `readonly` keyword, so
 * it always lands as an error-recovery token rather than a proper modifier
 * node (verified against the real parser output). Its text and position are
 * still faithful, so we detect it by scanning for that token — this is
 * still tree-based, just working around a grammar gap rather than an
 * officially-typed node.
 */
function findPropertyParameters(
  classDecl: SyntaxNode,
  doc: string,
): SyntaxNode[] {
  const ctor = findAll(classDecl, "MethodDeclaration").find(
    (m) => child(m, "Name") && textOf(child(m, "Name")!, doc) === "__construct",
  );
  const paramList = ctor ? child(ctor, "ParamList") : null;
  return paramList ? findAll(paramList, "PropertyParameter") : [];
}

function fieldsFromConstructor(
  classDecl: SyntaxNode,
  doc: string,
): FoundField[] {
  const classLevelReadonly = hasClassLevelReadonly(classDecl, doc);

  return findPropertyParameters(classDecl, doc).flatMap((param) => {
    const namedType = child(param, "NamedType");
    const variableName = child(param, "VariableName");
    if (!namedType || !variableName) {
      return [];
    }
    const typeText = textOf(namedType, doc).replace(/^\\/, "");
    const name = textOf(variableName, doc).replace(/^\$/, "");
    const paramReadonly =
      param.getChildren("readonly").length > 0 ||
      hasErrorTokenWithText(param, doc, "readonly");
    return [{ name, typeText, readonly: classLevelReadonly || paramReadonly }];
  });
}

function hasClassLevelReadonly(classDecl: SyntaxNode, doc: string): boolean {
  const declList = child(classDecl, "DeclarationList");
  let node = classDecl.firstChild;
  while (node && node !== declList) {
    if (node.type.isError && textOf(node, doc).trim() === "readonly") {
      return true;
    }
    node = node.nextSibling;
  }
  return false;
}

function validate(doc: string) {
  const tree = phpLanguage.parser.parse(doc);

  const classDecl = findAll(tree.topNode, "ClassDeclaration").find(
    (n) =>
      child(n, "Name") &&
      textOf(child(n, "Name")!, doc) === "CreateUserRequest",
  );

  const hasFinal = classDecl
    ? classDecl.getChildren("final").length > 0
    : false;
  const foundFields = classDecl ? fieldsFromConstructor(classDecl, doc) : [];

  const declaredCheck = {
    id: "construct",
    passed: Boolean(classDecl) && hasFinal,
    message: (() => {
      const copy = activeMessages().construct["request-dto"].php;
      if (!classDecl) return copy.missing;
      return hasFinal ? copy.ok : (copy.notImmutable ?? copy.missing);
    })(),
  };

  return toResult([
    declaredCheck,
    ...buildFieldChecks(foundFields, isTypeAcceptable),
    buildImmutabilityCheck(foundFields),
  ]);
}

export const phpAdapter: TaskLanguageAdapter = {
  language: "php",
  fileName: "CreateUserRequest.php",
  starterCode: TASK1_STARTER_CODE.php,
  solutionEditable: SOLUTION_EDITABLE,
  solutionCode: composeSolution(TASK1_STARTER_CODE.php, SOLUTION_EDITABLE),
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
      text: "Use PHP's constructor property promotion — each parameter becomes a public readonly property.",
      code: "public string $userName,",
    },
  ],
  validate,
};
