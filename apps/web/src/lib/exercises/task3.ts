import type { TaskDefinition } from "./types";

export const TASK3_DEFINITION: TaskDefinition = {
  id: "welcome-email-dto",
  order: 3,
  title: "Welcome Email DTO",
  shortTitle: "Email DTO",
  question: "What data does a welcome email need?",
  description:
    "Define the small immutable WelcomeEmail contract before mapping a created User for the notification boundary.",
  fields: [
    "recipientEmail: string",
    "recipientName: string",
    "subject: string",
    "body: string",
  ],
  estimatedMinutes: 7,
  explanation:
    "WelcomeEmail is an explicit notification contract. Defining it first makes the following mapping visible without sending an email.",
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
