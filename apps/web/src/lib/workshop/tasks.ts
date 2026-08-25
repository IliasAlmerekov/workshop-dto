import { TASK_IDS, type TaskId } from "./types";

export type TaskDefinition = {
  id: TaskId;
  order: number;
  title: string;
  /** Compact label used in the stepper, where horizontal space is tight. */
  shortTitle: string;
  question: string;
  description: string;
  fields: string[];
  estimatedMinutes: number;
  fileName: string;
};

export const TASK_DEFINITIONS: TaskDefinition[] = [
  {
    id: "request-dto",
    order: 1,
    title: "Typed Request DTO",
    shortTitle: "Request DTO",
    question: "How do we define a clear and typed input contract?",
    description:
      "We start by modeling the input contract for creating a user. Define a typed request object that captures all required fields with strong types and immutable properties.",
    fields: [
      "userName: string",
      "firstName: string",
      "lastName: string",
      "birthDate: Date",
      "email: string",
    ],
    estimatedMinutes: 8,
    fileName: "CreateUserRequest",
  },
  {
    id: "request-mapper",
    order: 2,
    title: "Request Mapper",
    shortTitle: "Request Mapper",
    question: "Where do renaming, normalization, and type conversion belong?",
    description:
      "Raw request data arrives with snake_case keys, stray whitespace, and mixed casing. Map it onto the typed request from step one.",
    fields: [
      "user_name → userName",
      "trim whitespace",
      "lowercase userName & email",
      "birth_date → typed date",
    ],
    estimatedMinutes: 9,
    fileName: "CreateUserRequestMapper",
  },
  {
    id: "welcome-email-dto",
    order: 3,
    title: "Welcome Email DTO",
    shortTitle: "Email DTO",
    question: "What contract does a welcome email need?",
    description:
      "Define the small immutable WelcomeEmail contract before mapping a created User for the notification boundary.",
    fields: [
      "recipientEmail: string",
      "recipientName: string",
      "subject: string",
      "body: string",
    ],
    estimatedMinutes: 7,
    fileName: "WelcomeEmail",
  },
  {
    id: "welcome-email-mapper",
    order: 4,
    title: "Welcome Email Mapper",
    shortTitle: "Email Mapper",
    question: "How do we prepare a welcome email without sending it?",
    description:
      "Map the created User into WelcomeEmail. The workshop prepares data only; it does not call an email provider.",
    fields: [
      "email → recipientEmail",
      "firstName + lastName → recipientName",
      "welcome subject",
      "body names participant",
    ],
    estimatedMinutes: 8,
    fileName: "WelcomeEmailMapper",
  },
  {
    id: "registration-response-dto",
    order: 5,
    title: "Registration Response DTO",
    shortTitle: "Response DTO",
    question: "What may the Registration Complete screen receive?",
    description:
      "Define the immutable public RegistrationResponse before exposing a created User.",
    fields: [
      "id: number",
      "userName: string",
      "displayName: string",
      "birthDate: string",
      "email: string",
    ],
    estimatedMinutes: 7,
    fileName: "RegistrationResponse",
  },
  {
    id: "registration-response-mapper",
    order: 6,
    title: "Registration Response Mapper",
    shortTitle: "Response Mapper",
    question: "How do we return a safe registration result?",
    description:
      "Map the created User into RegistrationResponse and deliberately exclude private entity fields.",
    fields: [
      "id, userName, email",
      "firstName + lastName → displayName",
      "birthDate → YYYY-MM-DD",
      "omit passwordHash and internalNote",
    ],
    estimatedMinutes: 8,
    fileName: "RegistrationResponseMapper",
  },
];

export function taskDefinition(id: TaskId): TaskDefinition {
  const task = TASK_DEFINITIONS.find((definition) => definition.id === id);
  if (!task) {
    throw new Error(`Unknown task id: ${id}`);
  }
  return task;
}

export function nextTaskId(id: TaskId): TaskId | null {
  const index = TASK_IDS.indexOf(id as (typeof TASK_IDS)[number]);
  return TASK_IDS[index + 1] ?? null;
}
