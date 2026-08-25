import type { TaskDefinition } from "./types";
export const TASK5_DEFINITION: TaskDefinition = {
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
  explanation:
    "RegistrationResponse is a public contract, not the internal User entity.",
};
