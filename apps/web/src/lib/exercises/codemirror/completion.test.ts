import { describe, expect, it, vi } from "vitest";
import {
  CompletionContext,
  completionStatus,
  startCompletion,
} from "@codemirror/autocomplete";
import { EditorState } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { TASK2_DEFINITION } from "../task2";
import { TASK4_DEFINITION } from "../task4";
import type { CompletionInput } from "../types";
import type { Language } from "@/lib/workshop/types";
import { workshopCompletion, workshopCompletionSource } from "./completion";
import { restrictedEditing } from "./restrictedEditing";

const BEFORE = "function map(form) {\n  return {\n";
const AFTER = "\n  };\n}\n";

/**
 * Builds a state whose editable region holds `typed`, with the cursor at its
 * end — the position the popup would open at while the participant types.
 */
function contextFor(typed: string, options: { explicit?: boolean } = {}) {
  const doc = BEFORE + typed + AFTER;
  const region = restrictedEditing({
    from: BEFORE.length,
    to: BEFORE.length + typed.length,
  });
  const state = EditorState.create({ doc, extensions: [region.extension] });
  const pos = BEFORE.length + typed.length;
  return {
    region,
    context: new CompletionContext(state, pos, options.explicit ?? false),
  };
}

function labelsFor(
  language: Language,
  typed: string,
  input?: CompletionInput,
  options: { explicit?: boolean } = {},
) {
  const { region, context } = contextFor(typed, options);
  const result = workshopCompletionSource(language, region, input)(context);
  return result?.options.map((option) => option.label) ?? null;
}

const TASK2_INPUT = TASK2_DEFINITION.completionInput!;

describe("workshopCompletionSource — member access per track", () => {
  const cases: Array<{ language: Language; typed: string; expected: string }> =
    [
      { language: "typescript", typed: "form.", expected: "form.user_name" },
      { language: "php", typed: "$form['", expected: "$form['user_name']" },
      { language: "python", typed: 'form["', expected: 'form["user_name"]' },
      {
        language: "java",
        typed: 'form.get("',
        expected: 'form.get("user_name")',
      },
    ];

  it.each(cases)(
    "spells the input field in $language syntax",
    ({ language, typed, expected }) => {
      expect(labelsFor(language, typed, TASK2_INPUT)).toContain(expected);
    },
  );

  it.each(cases)(
    "keeps matching once $language's member is half typed",
    ({ language, typed, expected }) => {
      expect(labelsFor(language, `${typed}user`, TASK2_INPUT)).toContain(
        expected,
      );
    },
  );

  it("offers every input field of the task, and only those", () => {
    expect(labelsFor("typescript", "form.", TASK2_INPUT)).toEqual([
      "form.user_name",
      "form.first_name",
      "form.last_name",
      "form.birth_date",
      "form.email",
    ]);
  });

  it("replaces the whole access expression, unbalanced bracket included", () => {
    const { region, context } = contextFor("$form['use");
    const result = workshopCompletionSource(
      "php",
      region,
      TASK2_INPUT,
    )(context);
    // `from` points at the `$`, so accepting rewrites `$raw['use` in full
    // rather than appending to a bracket that is still open.
    expect(context.state.doc.sliceString(result!.from, context.pos)).toBe(
      "$form['use",
    );
  });
});

describe("workshopCompletionSource — what it must never offer", () => {
  it("does not offer the target DTO's members", () => {
    const labels = labelsFor("typescript", "form.", TASK2_INPUT) ?? [];
    // The mapper's job is turning user_name into userName; the popup must not
    // be the thing that names the target field.
    for (const target of ["userName", "firstName", "birthDate"]) {
      expect(labels.some((label) => label.includes(target))).toBe(false);
    }
  });

  it("stays silent before the editable region", () => {
    const { region, context: atEnd } = contextFor("form.");
    const inPrefix = new CompletionContext(atEnd.state, 5, false);
    expect(
      workshopCompletionSource("typescript", region, TASK2_INPUT)(inPrefix),
    ).toBeNull();
  });

  it("stays silent after the editable region", () => {
    const { region, context: atEnd } = contextFor("form.");
    const inSuffix = new CompletionContext(
      atEnd.state,
      atEnd.state.doc.length - 2,
      false,
    );
    expect(
      workshopCompletionSource("typescript", region, TASK2_INPUT)(inSuffix),
    ).toBeNull();
  });

  it("does offer the entity's forbidden fields in Task 4 — a real IDE would too", () => {
    const labels = labelsFor(
      "typescript",
      "user.",
      TASK4_DEFINITION.completionInput!,
    );
    expect(labels).toContain("user.passwordHash");
  });
});

describe("workshopCompletionSource — identifiers and built-ins", () => {
  it("does not open on a single typed character", () => {
    expect(labelsFor("typescript", "t", TASK2_INPUT)).toBeNull();
  });

  it("opens on a single character when asked explicitly", () => {
    expect(
      labelsFor("typescript", "t", TASK2_INPUT, { explicit: true }),
    ).toContain("trim");
  });

  it("offers the track's built-ins once two characters are typed", () => {
    expect(labelsFor("typescript", "tr", TASK2_INPUT)).toContain("trim");
    expect(labelsFor("php", "st", TASK2_INPUT)).toContain("strtolower");
    expect(labelsFor("python", "st", TASK2_INPUT)).toContain("strip");
    expect(labelsFor("java", "Lo", TASK2_INPUT)).toContain("LocalDate");
  });

  it("keeps the built-in list short enough to read over a one-line region", () => {
    for (const language of [
      "typescript",
      "php",
      "python",
      "java",
    ] as Language[]) {
      const labels = labelsFor(language, "aa", TASK2_INPUT, {
        explicit: true,
      })!;
      expect(labels.length).toBeLessThanOrEqual(10);
    }
  });

  it("offers the receiver itself, spelled for the track", () => {
    expect(labelsFor("php", "fo", TASK2_INPUT)).toContain("$form");
    expect(labelsFor("typescript", "fo", TASK2_INPUT)).toContain("form");
  });

  it("offers only built-ins for a task with no input, such as Task 1", () => {
    expect(labelsFor("typescript", "tr")).toEqual([
      "trim",
      "toLowerCase",
      "Date",
      "Number",
      "toISOString",
      "slice",
    ]);
  });
});

/**
 * The one place the wiring itself is tested rather than the source: Tab is
 * bound at the highest precedence, which is exactly the kind of thing a
 * keymap refactor breaks silently — and breaking it turns the editor into a
 * keyboard trap (docs/ACCESSIBILITY.md).
 */
describe("workshopCompletion — Tab", () => {
  function mountView(typed: string) {
    const doc = BEFORE + typed + AFTER;
    const pos = BEFORE.length + typed.length;
    const region = restrictedEditing({ from: BEFORE.length, to: pos });
    return new EditorView({
      parent: document.body,
      state: EditorState.create({
        doc,
        selection: { anchor: pos },
        extensions: [
          region.extension,
          workshopCompletion("typescript", region, TASK2_INPUT),
        ],
      }),
    });
  }

  function pressTab(view: EditorView) {
    const event = new KeyboardEvent("keydown", {
      key: "Tab",
      bubbles: true,
      cancelable: true,
    });
    view.contentDOM.dispatchEvent(event);
    return event;
  }

  it("inserts the selected completion", async () => {
    const view = mountView("form.");
    startCompletion(view);
    await vi.waitFor(() => expect(completionStatus(view.state)).toBe("active"));
    // CodeMirror ignores accept keys for `interactionDelay` (75ms) after the
    // popup opens, so a keystroke already in flight cannot pick an option the
    // participant never saw.
    await new Promise((resolve) => setTimeout(resolve, 100));

    const event = pressTab(view);

    expect(view.state.doc.toString()).toContain("form.user_name");
    expect(event.defaultPrevented).toBe(true);
    view.destroy();
  });

  it("falls through to the browser when no completion is open, so focus can leave the editor", () => {
    const view = mountView("form.");

    const event = pressTab(view);

    expect(event.defaultPrevented).toBe(false);
    expect(view.state.doc.toString()).not.toContain("form.user_name");
    view.destroy();
  });
});
