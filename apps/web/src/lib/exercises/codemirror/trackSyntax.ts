import type { Language } from "@/lib/workshop/types";
import type { CompletionInput } from "../types";

/**
 * The purely syntactic half of Completion. Tasks own *which* symbols may be
 * offered (`TaskDefinition.completionInput`); a track owns only how those
 * symbols are spelled — the same split the task/adapter pair already uses,
 * factored into one table so a new task inherits all four tracks for free.
 */
export type TrackSyntax = {
  /** How the receiver variable itself appears in source — PHP writes `$raw`. */
  receiverText: (receiver: string) => string;
  /** The complete expression that reads `member` off the receiver. */
  memberAccess: (input: CompletionInput, member: string) => string;
  /**
   * The handful of built-ins the four tasks actually need. Deliberately not
   * the language's full keyword list: the editable region is a single line,
   * and a fifty-entry list buries the two entries that matter.
   */
  builtins: readonly string[];
};

export const TRACK_SYNTAX: Record<Language, TrackSyntax> = {
  typescript: {
    receiverText: (receiver) => receiver,
    // The raw payload is declared as an inline object type, so both shapes
    // read the same way.
    memberAccess: (input, member) => `${input.receiver}.${member}`,
    builtins: ["trim", "toLowerCase", "Date", "Number", "toISOString", "slice"],
  },
  php: {
    receiverText: (receiver) => `$${receiver}`,
    memberAccess: (input, member) =>
      input.shape === "map"
        ? `$${input.receiver}['${member}']`
        : `$${input.receiver}->${member}`,
    builtins: ["trim", "strtolower", "intval", "DateTimeImmutable", "format"],
  },
  python: {
    receiverText: (receiver) => receiver,
    memberAccess: (input, member) =>
      input.shape === "map"
        ? `${input.receiver}["${member}"]`
        : `${input.receiver}.${member}`,
    builtins: [
      "strip",
      "lower",
      "int",
      "date",
      "datetime",
      "fromisoformat",
      "strftime",
    ],
  },
  java: {
    receiverText: (receiver) => receiver,
    // Records expose components as accessor methods, and the raw payload
    // arrives as a Map — neither shape is a bare field read.
    memberAccess: (input, member) =>
      input.shape === "map"
        ? `${input.receiver}.get("${member}")`
        : `${input.receiver}.${member}()`,
    builtins: [
      "trim",
      "toLowerCase",
      "equals",
      "Integer",
      "LocalDate",
      "Instant",
      "parse",
      "DateTimeFormatter",
    ],
  },
};
