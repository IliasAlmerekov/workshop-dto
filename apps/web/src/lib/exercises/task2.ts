import type { TaskDefinition } from "./types";

/**
 * Language-neutral definition of Task 2 (spec section 6.2). Owns the raw
 * payload, the learning goal, and the expected normalized result; adapters
 * own everything language-specific about how to express and check it.
 */
export const TASK2_DEFINITION: TaskDefinition = {
  id: "request-mapper",
  order: 2,
  title: "Request Mapper",
  shortTitle: "Request Mapper",
  question: "Where do renaming, normalization, and type conversion belong?",
  description:
    "Raw request data arrives with snake_case keys, stray whitespace, and mixed casing. Map it onto the typed CreateUserRequest from step one.",
  fields: [
    "user_name → userName",
    "trim whitespace",
    "lowercase userName & email",
    "birth_date → typed date",
  ],
  estimatedMinutes: 9,
  explanation:
    "The mapper concentrates boundary logic in one visible, testable place. Renaming, trimming, and case normalization all happen here — once — instead of being repeated (or forgotten) everywhere the request is used.",
};

/** The raw payload every language track maps from (spec section 6.2). */
export const TASK2_RAW_PAYLOAD = {
  user_name: "  Ada.Lovelace ",
  first_name: " Ada ",
  last_name: " Lovelace ",
  birth_date: "1815-12-10",
  email: " ADA@EXAMPLE.TEST ",
} as const;

export type Task2FieldSpec = {
  outputName: string;
  sourceKey: keyof typeof TASK2_RAW_PAYLOAD;
  needsLowercase: boolean;
  isDate: boolean;
};

export const TASK2_FIELDS: Task2FieldSpec[] = [
  {
    outputName: "userName",
    sourceKey: "user_name",
    needsLowercase: true,
    isDate: false,
  },
  {
    outputName: "firstName",
    sourceKey: "first_name",
    needsLowercase: false,
    isDate: false,
  },
  {
    outputName: "lastName",
    sourceKey: "last_name",
    needsLowercase: false,
    isDate: false,
  },
  {
    outputName: "birthDate",
    sourceKey: "birth_date",
    needsLowercase: false,
    isDate: true,
  },
  {
    outputName: "email",
    sourceKey: "email",
    needsLowercase: true,
    isDate: false,
  },
];
