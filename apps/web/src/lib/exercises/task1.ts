import type { TaskDefinition } from "./types";

/**
 * Language-neutral definition of Task 1 (spec section 6.1). Owns the
 * learning goal, expected result, and explanation; adapters own everything
 * language-specific.
 */
export const TASK1_DEFINITION: TaskDefinition = {
  id: "request-dto",
  order: 1,
  title: "Typed Request DTO",
  shortTitle: "Request DTO",
  question: "How do we define a clear and typed input contract?",
  description:
    "We start by modeling the input contract for creating a user. Complete an immutable CreateUserRequest that captures all required fields with strong types.",
  fields: [
    "userName: string",
    "firstName: string",
    "lastName: string",
    "birthDate: date",
    "email: string",
  ],
  estimatedMinutes: 8,
  explanation:
    "CreateUserRequest is a DTO, not the domain entity: it exists only to make the data crossing this boundary explicit and typed. Marking every field immutable means nothing downstream can silently mutate the request after it was created.",
};

export const TASK1_REQUIRED_FIELDS = [
  { name: "userName", kind: "string" },
  { name: "firstName", kind: "string" },
  { name: "lastName", kind: "string" },
  { name: "birthDate", kind: "date" },
  { name: "email", kind: "string" },
] as const;

export type RequiredFieldKind = (typeof TASK1_REQUIRED_FIELDS)[number]["kind"];
