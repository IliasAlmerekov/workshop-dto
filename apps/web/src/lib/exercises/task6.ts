import type { TaskDefinition } from "./types";
export const TASK6_DEFINITION: TaskDefinition = {
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
  explanation:
    "The public mapper isolates Registration Complete from internal User fields.",
};
