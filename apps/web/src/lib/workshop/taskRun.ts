import {
  TASK1_REQUIRED_FIELDS,
  TASK1_SAMPLE_PAYLOAD,
} from "@/lib/exercises/task1";
import {
  TASK2_FIELDS,
  TASK2_LEGACY_REGISTRATION_PAYLOAD,
} from "@/lib/exercises/task2";
import {
  TASK4_ENTITY_SAMPLE,
  TASK4_FIELDS,
  TASK4_FORBIDDEN_FIELDS,
} from "@/lib/exercises/task4";
import type { TaskId } from "./types";

/**
 * The reference run behind the workshop's result column.
 *
 * **Participant code is never executed** (spec 9.1) — not here either. What
 * this module runs is the *reference* transformation, written once in the
 * app's own language, over the same language-neutral fixtures the validators
 * and every track adapter already share. So the panel shows what a correct
 * mapper produces for the sample payload, derived from `TASK2_FIELDS`,
 * `TASK3_FIELDS` and `TASK4_FIELDS` rather than transcribed next to them —
 * a copy would drift the moment a field spec changed.
 */

export type ValueKind = "string" | "number" | "boolean" | "date";

export type RunField = {
  /** Field name on the produced object. */
  key: string;
  /** The produced value, already rendered for display. */
  value: string;
  kind: ValueKind;
  /** Input key(s) it came from, joined for display. */
  source: string;
  /** What the mapper did, e.g. "trimmed · lowercased". Empty when nothing did. */
  transform: string;
};

export type OmittedField = {
  key: string;
  reason: string;
};

export type TaskRun = {
  /** Where the input comes from, in the story the workshop tells. */
  inputCaption: string;
  input: Record<string, string | number | boolean>;
  /** The type the exercise produces. */
  outputName: string;
  fields: RunField[];
  omitted: OmittedField[];
};

/** Renders a produced value the way the result column prints it. */
function display(value: string | number | boolean): string {
  return typeof value === "string" ? value : String(value);
}

function joinTransforms(steps: string[]): string {
  return steps.join(" · ");
}

/** `1815-12-10T00:00:00+00:00` → `1815-12-10`, the format Task 4 asks for. */
function isoDate(value: string): string {
  return value.slice(0, 10);
}

function task1Run(): TaskRun {
  return {
    inputCaption: "Validated input for POST /api/users",
    input: { ...TASK1_SAMPLE_PAYLOAD },
    outputName: "CreateUserRequest",
    fields: TASK1_REQUIRED_FIELDS.map((field) => ({
      key: field.name,
      value: display(TASK1_SAMPLE_PAYLOAD[field.name]),
      kind: field.kind === "date" ? "date" : "string",
      source: field.name,
      // Nothing is transformed in Task 1 — the contract is the lesson. Only
      // the field that is *not* a string has something worth saying.
      transform: field.kind === "date" ? "held as a date, not as text" : "",
    })),
    omitted: [],
  };
}

function task2Run(): TaskRun {
  return {
    inputCaption:
      "Legacy registration form — snake_case, extra whitespace, mixed casing",
    input: { ...TASK2_LEGACY_REGISTRATION_PAYLOAD },
    outputName: "CreateUserRequest",
    fields: TASK2_FIELDS.map((field) => {
      const formValue = TASK2_LEGACY_REGISTRATION_PAYLOAD[field.sourceKey];
      const trimmed = formValue.trim();
      const normalised = field.needsLowercase ? trimmed.toLowerCase() : trimmed;
      const steps: string[] = [];
      if (field.sourceKey !== field.outputName) {
        steps.push("renamed");
      }
      if (trimmed !== formValue) {
        steps.push("trimmed");
      }
      if (field.needsLowercase && normalised !== trimmed) {
        steps.push("lowercased");
      }
      if (field.isDate) {
        steps.push("parsed to a date");
      }

      return {
        key: field.outputName,
        value: field.isDate ? isoDate(normalised) : normalised,
        kind: field.isDate ? ("date" as const) : ("string" as const),
        source: field.sourceKey,
        transform: joinTransforms(steps),
      };
    }),
    omitted: [],
  };
}

function welcomeEmailDtoRun(): TaskRun {
  return {
    inputCaption: "Notification contract for the welcome-email boundary",
    input: {},
    outputName: "WelcomeEmail",
    fields: ["recipientEmail", "recipientName", "subject", "body"].map(
      (key) => ({
        key,
        value:
          key === "subject"
            ? "Welcome to the new registration service"
            : key === "body"
              ? "Welcome, Ada Lovelace!"
              : key === "recipientName"
                ? "Ada Lovelace"
                : "ada@example.test",
        kind: "string" as const,
        source: "WelcomeEmail contract",
        transform: "declared for the email consumer",
      }),
    ),
    omitted: [],
  };
}

function welcomeEmailMapperRun(): TaskRun {
  const user = { ...TASK4_ENTITY_SAMPLE };
  return {
    inputCaption: "Created internal User — email is prepared locally only",
    input: user,
    outputName: "WelcomeEmail",
    fields: [
      {
        key: "recipientEmail",
        value: user.email,
        kind: "string" as const,
        source: "email",
        transform: "renamed",
      },
      {
        key: "recipientName",
        value: `${user.firstName} ${user.lastName}`,
        kind: "string" as const,
        source: "firstName + lastName",
        transform: "joined",
      },
      {
        key: "subject",
        value: "Welcome to the new registration service",
        kind: "string" as const,
        source: "welcome template",
        transform: "prepared, not sent",
      },
      {
        key: "body",
        value: `Welcome, ${user.firstName} ${user.lastName}!`,
        kind: "string" as const,
        source: "firstName + lastName",
        transform: "prepared, not sent",
      },
    ],
    omitted: [],
  };
}

function registrationResponseRun(): TaskRun {
  const entity: Record<string, string | number> = { ...TASK4_ENTITY_SAMPLE };
  const mapped = new Set<string>();

  const fields = TASK4_FIELDS.map((field) => {
    if (field.kind === "combine") {
      const [first, second] = field.combineKeys ?? ["", ""];
      mapped.add(first);
      mapped.add(second);
      return {
        key: field.outputName,
        value: `${entity[first]} ${entity[second]}`,
        kind: "string" as const,
        source: `${first} + ${second}`,
        transform: "joined into one display name",
      };
    }

    const sourceKey = field.sourceKey ?? field.outputName;
    mapped.add(sourceKey);
    const raw = entity[sourceKey];

    if (field.kind === "format") {
      return {
        key: field.outputName,
        value: isoDate(String(raw)),
        kind: "string" as const,
        source: sourceKey,
        transform: "formatted as YYYY-MM-DD",
      };
    }

    return {
      key: field.outputName,
      value: display(raw),
      kind: typeof raw === "number" ? ("number" as const) : ("string" as const),
      source: sourceKey,
      transform: "",
    };
  });

  const forbidden: readonly string[] = TASK4_FORBIDDEN_FIELDS;
  const omitted = Object.keys(entity)
    .filter((key) => !mapped.has(key))
    .map((key) => ({
      key,
      reason: forbidden.includes(key)
        ? "must never leave the boundary"
        : "not part of the public contract",
    }));

  return {
    inputCaption: "Internal User entity, as the demo API stores it",
    input: entity,
    outputName: "RegistrationResponse",
    fields,
    omitted,
  };
}

const RUNS: Record<TaskId, () => TaskRun> = {
  "request-dto": task1Run,
  "request-mapper": task2Run,
  "welcome-email-dto": welcomeEmailDtoRun,
  "welcome-email-mapper": welcomeEmailMapperRun,
  "registration-response-dto": registrationResponseRun,
  "registration-response-mapper": registrationResponseRun,
};

export function runTask(taskId: TaskId): TaskRun {
  return RUNS[taskId]();
}
