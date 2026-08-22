import type { TaskDefinition } from "./types";

export const TASK4_DEFINITION: TaskDefinition = {
  id: "response-dto",
  order: 4,
  title: "Response DTO and Entity Mapper",
  shortTitle: "Response DTO",
  question: "How do we produce a safe, stable public response?",
  description:
    "The internal User entity carries more than the public contract should expose. Map it onto a response that is safe to serialize.",
  fields: [
    "id, userName, email kept as is",
    "firstName + lastName → displayName",
    "birthDate formatted YYYY-MM-DD",
    "passwordHash & internalNote omitted",
  ],
  estimatedMinutes: 10,
  explanation:
    "The public contract contains only what the client actually needs. Building it explicitly — rather than serializing the entity directly — means passwordHash and internalNote can never leak by accident, even as the entity grows new fields over time.",
};

export type Task4FieldKind = "passthrough" | "combine" | "format";

export type Task4FieldSpec = {
  outputName: string;
  kind: Task4FieldKind;
  sourceKey?: string;
  combineKeys?: readonly [string, string];
};

export const TASK4_FIELDS: Task4FieldSpec[] = [
  { outputName: "id", kind: "passthrough", sourceKey: "id" },
  { outputName: "userName", kind: "passthrough", sourceKey: "userName" },
  {
    outputName: "displayName",
    kind: "combine",
    combineKeys: ["firstName", "lastName"],
  },
  { outputName: "birthDate", kind: "format", sourceKey: "birthDate" },
  { outputName: "email", kind: "passthrough", sourceKey: "email" },
];

/** Fields that must never appear anywhere in the mapped response (spec section 5.1/6.4). */
export const TASK4_FORBIDDEN_FIELDS = ["passwordHash", "internalNote"] as const;
