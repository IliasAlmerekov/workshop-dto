import type { TaskDefinition } from "./types";

/**
 * The internal entity Task 4 maps from, mirroring the demo API's
 * `UserSampleProvider::find(7)` field for field — including the two fields
 * that must never reach the response.
 */
export const TASK4_ENTITY_SAMPLE = {
  id: 7,
  userName: "ada.lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  birthDate: "1815-12-10T00:00:00+00:00",
  email: "ada@example.test",
  passwordHash:
    "$argon2id$v=19$m=65536,t=4,p=1$c29tZXNhbHQ$ZGVtb29ubHlub3RyZWFs",
  internalNote: "VIP migration candidate",
  createdAt: "2024-01-01T00:00:00+00:00",
} as const;

export const TASK4_DEFINITION: TaskDefinition = {
  id: "welcome-email-mapper",
  order: 4,
  title: "Welcome Email Mapper",
  shortTitle: "Email Mapper",
  question: "How do we prepare a welcome email without sending it?",
  description:
    "Map the created User into WelcomeEmail. This prepares data only; it has no email provider or side effect.",
  fields: [
    "email → recipientEmail",
    "firstName + lastName → recipientName",
    "welcome subject",
    "body names participant",
  ],
  estimatedMinutes: 8,
  explanation:
    "The mapper makes the outbound notification boundary explicit. It prepares only the data the email consumer needs.",
  /**
   * Every entity member, `passwordHash` and `internalNote` included. Hiding
   * them would be the wrong lesson: a real IDE offers them too, and the whole
   * point of Task 4 is that the participant has to decide not to use them.
   * The forbidden-field check (task4Checks.ts) is what enforces that.
   */
  completionInput: {
    receiver: "user",
    shape: "object",
    members: Object.keys(TASK4_ENTITY_SAMPLE),
  },
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
