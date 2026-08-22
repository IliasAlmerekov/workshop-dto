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
    fileName: "IdentityCheckResultMapper",
  },
  {
    id: "response-dto",
    order: 4,
    title: "Response DTO and Entity Mapper",
    shortTitle: "Response DTO",
    question: "How do we produce a safe, stable public response?",
    description:
      "The internal User entity carries more than the public contract should expose. Map it onto a response that is safe to serialize.",
    fields: [
      "userName kept as is",
      "firstName + lastName → displayName",
      "birthDate formatted YYYY-MM-DD",
      "passwordHash & internalNote omitted",
    ],
    estimatedMinutes: 10,
    fileName: "UserResponseMapper",
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
  const index = TASK_IDS.indexOf(id);
  return TASK_IDS[index + 1] ?? null;
}
