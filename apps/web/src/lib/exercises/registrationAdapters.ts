import { en } from "@/lib/i18n/en";
import type { Language } from "@/lib/workshop/types";
import type { StarterCode, TaskLanguageAdapter } from "./types";

type Kind =
  | "welcome-email-dto"
  | "welcome-email-mapper"
  | "registration-response-dto"
  | "registration-response-mapper";
const names: Record<Kind, string> = {
  "welcome-email-dto": "WelcomeEmail",
  "welcome-email-mapper": "WelcomeEmailMapper",
  "registration-response-dto": "RegistrationResponse",
  "registration-response-mapper": "RegistrationResponseMapper",
};
const required: Record<Kind, readonly string[]> = {
  "welcome-email-dto": ["recipientEmail", "recipientName", "subject", "body"],
  "welcome-email-mapper": [
    "recipientEmail",
    "recipientName",
    "subject",
    "body",
    "email",
    "firstName",
    "lastName",
  ],
  "registration-response-dto": [
    "id",
    "userName",
    "displayName",
    "birthDate",
    "email",
  ],
  "registration-response-mapper": [
    "id",
    "userName",
    "displayName",
    "birthDate",
    "email",
    "firstName",
    "lastName",
  ],
};
const dto = (kind: Kind) => kind.endsWith("dto");

function starter(kind: Kind, language: Language): StarterCode {
  const name = names[kind];
  const target = name.replace("Mapper", "");
  if (dto(kind)) {
    if (language === "typescript")
      return {
        before: `export type ${name} = {\n`,
        editable: "  // TODO: declare the contract fields\n",
        after: "};\n",
      };
    if (language === "php")
      return {
        before: `<?php\n\nfinal readonly class ${name}\n{\n    public function __construct(\n`,
        editable: "        // TODO: declare the contract fields\n",
        after: "    ) {}\n}\n",
      };
    if (language === "python")
      return {
        before: `from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass ${name}:\n`,
        editable: "    # TODO: declare the contract fields\n    pass\n",
        after: "",
      };
    return {
      before: `public record ${name}(\n`,
      editable: "    // TODO: declare the contract fields\n",
      after: ") {}\n",
    };
  }
  if (language === "typescript")
    return {
      before: `export function map${target}(user: User): ${target} {\n  return {\n`,
      editable: "    // TODO: map only the required fields\n",
      after: "  };\n}\n",
    };
  if (language === "php")
    return {
      before: `<?php\n\nfinal class ${name}\n{\n    public function map(User $user): ${target}\n    {\n        return new ${target}(\n`,
      editable: "            // TODO: map only the required fields\n",
      after: "        );\n    }\n}\n",
    };
  if (language === "python")
    return {
      before: `class ${name}:\n    def map(self, user: User) -> ${target}:\n        return {\n`,
      editable: "            # TODO: map only the required fields\n",
      after: "        }\n",
    };
  return {
    before: `public final class ${name} {\n    public ${target} map(User user) {\n        return new ${target}(\n`,
    editable: "            // TODO: map only the required fields\n",
    after: "        );\n    }\n}\n",
  };
}

function solution(kind: Kind, language: Language) {
  const email = kind === "welcome-email-mapper";
  const all = required[kind].filter(
    (field) => !["firstName", "lastName"].includes(field),
  );
  if (dto(kind)) {
    if (language === "typescript")
      return (
        all
          .map((f) => `  readonly ${f}: ${f === "id" ? "number" : "string"};`)
          .join("\n") + "\n"
      );
    if (language === "php")
      return (
        all
          .map((f) => `        public ${f === "id" ? "int" : "string"} $${f},`)
          .join("\n") + "\n"
      );
    if (language === "python")
      return (
        all.map((f) => `    ${f}: ${f === "id" ? "int" : "str"}`).join("\n") +
        "\n"
      );
    return (
      all.map((f) => `    ${f === "id" ? "int" : "String"} ${f},`).join("\n") +
      "\n"
    );
  }
  if (language === "typescript")
    return email
      ? "    recipientEmail: user.email,\n    recipientName: user.firstName + ' ' + user.lastName,\n    subject: 'Welcome',\n    body: 'Welcome, ' + user.firstName + '!',\n"
      : "    id: user.id,\n    userName: user.userName,\n    displayName: user.firstName + ' ' + user.lastName,\n    birthDate: user.birthDate.toISOString().slice(0, 10),\n    email: user.email,\n";
  if (language === "python")
    return email
      ? "            'recipientEmail': user.email,\n            'recipientName': user.firstName + ' ' + user.lastName,\n            'subject': 'Welcome',\n            'body': 'Welcome, ' + user.firstName + '!',\n"
      : "            'id': user.id,\n            'userName': user.userName,\n            'displayName': user.firstName + ' ' + user.lastName,\n            'birthDate': user.birthDate.strftime('%Y-%m-%d'),\n            'email': user.email,\n";
  if (language === "php")
    return email
      ? "            recipientEmail: $user->email,\n            recipientName: $user->firstName . ' ' . $user->lastName,\n            subject: 'Welcome',\n            body: 'Welcome, ' . $user->firstName . '!',\n"
      : "            id: $user->id,\n            userName: $user->userName,\n            displayName: $user->firstName . ' ' . $user->lastName,\n            birthDate: $user->birthDate->format('Y-m-d'),\n            email: $user->email,\n";
  return email
    ? '            /* recipientEmail */ user.email(),\n            /* recipientName */ user.firstName() + " " + user.lastName(),\n            /* subject */ "Welcome",\n            /* body */ "Welcome, " + user.firstName() + "!"\n'
    : '            /* id */ user.id(),\n            /* userName */ user.userName(),\n            /* displayName */ user.firstName() + " " + user.lastName(),\n            /* birthDate */ user.birthDate().toString(),\n            /* email */ user.email()\n';
}

export function registrationAdapter(
  kind: Kind,
  language: Language,
): TaskLanguageAdapter {
  const starterCode = starter(kind, language);
  const solutionEditable = solution(kind, language);
  const document = starterCode.before + solutionEditable + starterCode.after;
  const hints = en.hints[kind][language];
  return {
    language,
    fileName: `${names[kind]}.${language === "typescript" ? "ts" : language === "python" ? "py" : language}`,
    starterCode,
    solutionEditable,
    solutionCode: document,
    hints: [
      { kind: "concept", text: hints.concept },
      { kind: "fields", text: hints.fields },
      {
        kind: "syntax",
        text: hints.syntax,
        code: solutionEditable.split("\n")[0],
      },
    ],
    validate: (source) => {
      const checks = required[kind].map((field) => ({
        id: `field-${field}`,
        passed: source.includes(field),
        message: source.includes(field)
          ? `${field} is included.`
          : `${field} is missing.`,
      }));
      if (dto(kind))
        checks.push({
          id: "immutable",
          passed: /readonly|frozen=True|\brecord\b/.test(source),
          message: "The DTO must be immutable.",
        });
      if (kind === "registration-response-mapper")
        checks.push(
          ...["passwordHash", "internalNote"].map((field) => ({
            id: `no-leak-${field}`,
            passed: !source.includes(field),
            message: `${field} must stay private.`,
          })),
        );
      return { passed: checks.every((check) => check.passed), checks };
    },
  };
}
