import type { TaskDefinition } from "./types";

export const TASK3_DEFINITION: TaskDefinition = {
  id: "external-api",
  order: 3,
  title: "External API DTO and Mapper",
  shortTitle: "External API",
  question: "How do we protect our application from a foreign API contract?",
  description:
    "The external identity service returns its own vocabulary. Map its response onto a dedicated result type owned by our application.",
  fields: [
    "subject_id → userId: number",
    "verification_state → verified: boolean",
    "checked_at → checkedAt: timestamp",
  ],
  estimatedMinutes: 9,
  explanation:
    "Isolating the third-party vocabulary at the integration boundary means a provider change to field names, casing, or representation only touches this one mapper — the rest of the application keeps working against its own stable contract.",
};

export const TASK3_RAW_PAYLOAD = {
  subject_id: "7",
  verification_state: "VERIFIED",
  checked_at: "2026-08-01T10:15:00Z",
} as const;

export type Task3FieldKind = "integer" | "boolean" | "date";

export type Task3FieldSpec = {
  outputName: string;
  sourceKey: keyof typeof TASK3_RAW_PAYLOAD;
  kind: Task3FieldKind;
};

export const TASK3_FIELDS: Task3FieldSpec[] = [
  { outputName: "userId", sourceKey: "subject_id", kind: "integer" },
  { outputName: "verified", sourceKey: "verification_state", kind: "boolean" },
  { outputName: "checkedAt", sourceKey: "checked_at", kind: "date" },
];
