import {
  acceptCompletion,
  autocompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { Prec, type Extension } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import type { Language } from "@/lib/workshop/types";
import type { CompletionInput } from "../types";
import type { RestrictedRegion } from "./restrictedEditing";
import { TRACK_SYNTAX } from "./trackSyntax";

/**
 * How many characters of an identifier the participant has to type before the
 * popup opens on its own. One character matches nearly every built-in and
 * turns the popup into noise over a one-line editable region; Ctrl-Space
 * still opens it explicitly at any point.
 */
const MIN_IDENTIFIER_LENGTH = 2;

/** Bare identifiers, plus PHP's leading `$`. */
const IDENTIFIER = /\$?[A-Za-z_][\w]*$/;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Matches a half-typed member access on the receiver, across all four tracks:
 * `raw.user`, `$raw['user`, `raw["user`, `raw.get("user`. The whole match is
 * replaced by the track's full spelling, which is why the opening bracket or
 * quote does not have to be balanced yet.
 */
function memberAccessPattern(receiverText: string): RegExp {
  return new RegExp(
    `${escapeRegExp(receiverText)}\\s*(?:->|\\.get\\(\\s*["']|\\.|\\[\\s*["'])\\s*[\\w]*$`,
  );
}

/**
 * CodeMirror orders equally-good matches by label, which would shuffle the
 * task's fields into alphabetical order. `sortText` pins them to the order
 * the task lists them in, so the popup reads like the task brief.
 */
function orderKey(index: number): string {
  return String(index).padStart(3, "0");
}

function builtinCompletion(name: string, index: number): Completion {
  return {
    label: name,
    // Uppercase leads are the tracks' date/number classes; the rest are
    // methods and functions. The distinction only drives the popup's icon.
    type: /^[A-Z]/.test(name) ? "class" : "function",
    sortText: orderKey(index),
  };
}

/**
 * The workshop's single Completion source, shared by all four tracks.
 *
 * It offers exactly two things: the task's input symbols spelled in the
 * track's syntax, and a short list of that track's built-ins. It never offers
 * members of the target DTO — that is the staged Hint's job, and a popup that
 * dictated the answer would make the last hint card and the check pointless.
 *
 * It is deliberately registered as `override`, replacing the language
 * packages' own sources: `@codemirror/lang-javascript` ships scope-aware
 * completion that the PHP, Python and Java packages do not, and letting it
 * through would silently make the TypeScript track richer than the other
 * three.
 */
export function workshopCompletionSource(
  language: Language,
  region: RestrictedRegion,
  input?: CompletionInput,
) {
  const syntax = TRACK_SYNTAX[language];

  return function complete(
    context: CompletionContext,
  ): CompletionResult | null {
    // Outside the editable region every insertion would be rejected by
    // restrictedEditing anyway. A popup that cannot apply reads as a broken
    // editor, so there must not be one.
    const range = region.rangeOf(context.state);
    if (context.pos < range.from || context.pos > range.to) {
      return null;
    }

    if (input) {
      const receiverText = syntax.receiverText(input.receiver);
      const access = context.matchBefore(memberAccessPattern(receiverText));
      if (access) {
        return {
          from: access.from,
          options: input.members.map((member, index) => ({
            // The label carries the full access expression so CodeMirror
            // filters against what the participant actually typed, and
            // accepting it rewrites the whole (still unbalanced) expression.
            label: syntax.memberAccess(input, member),
            detail: "input field",
            type: "property",
            sortText: orderKey(index),
          })),
        };
      }
    }

    const word = context.matchBefore(IDENTIFIER);
    if (!word) {
      return null;
    }
    if (!context.explicit && word.to - word.from < MIN_IDENTIFIER_LENGTH) {
      return null;
    }

    const options = syntax.builtins.map((name, index) =>
      // Offset so the receiver, unshifted below, still sorts first.
      builtinCompletion(name, index + 1),
    );
    if (input) {
      options.unshift({
        label: syntax.receiverText(input.receiver),
        detail: "task input",
        type: "variable",
        sortText: orderKey(0),
      });
    }
    return { from: word.from, options };
  };
}

/**
 * Completion wired for the workshop editor, including Tab as an accept key.
 *
 * Tab is bound at the highest precedence but through `acceptCompletion`,
 * which returns false when no popup is open — so Tab still moves focus out of
 * the editor, and the code area never becomes a keyboard trap
 * (docs/ACCESSIBILITY.md).
 */
export function workshopCompletion(
  language: Language,
  region: RestrictedRegion,
  input?: CompletionInput,
): Extension {
  return [
    autocompletion({
      override: [workshopCompletionSource(language, region, input)],
      // Matches the VS Code feel the workshop is compared against; the
      // source's own guards keep it from firing on every first letter.
      activateOnTyping: true,
    }),
    Prec.highest(keymap.of([{ key: "Tab", run: acceptCompletion }])),
  ];
}
