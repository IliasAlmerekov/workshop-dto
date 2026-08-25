import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@/lib/workshop/types";
import { loadTask3Adapter } from "./task3Adapters";

describe("loadTask3Adapter", () => {
  it.each(LANGUAGES)("loads a working adapter for %s", async (language) => {
    const adapter = await loadTask3Adapter(language);
    expect(adapter.language).toBe(language);

    // solutionCode must be exactly the starter's fixed frame around
    // solutionEditable — this is the invariant "Insert solution" relies on.
    expect(adapter.solutionCode).toBe(
      adapter.starterCode.before +
        adapter.solutionEditable +
        adapter.starterCode.after,
    );

    const result = adapter.validate(adapter.solutionCode);
    expect(result.passed).toBe(true);

    expect(result.checks.map((check) => check.id)).toEqual(
      expect.arrayContaining([
        "field-recipientEmail",
        "field-recipientName",
        "field-subject",
        "field-body",
        "immutable",
      ]),
    );

    // Three progressive hint cards before "Insert solution" (spec 7.3).
    expect(adapter.hints).toHaveLength(3);
    expect(adapter.hints[0].kind).toBe("concept");
    expect(adapter.hints[1].kind).toBe("fields");
    expect(adapter.hints[2].kind).toBe("syntax");
  });

  it("never returns hidden solution text for a failed check message", async () => {
    for (const language of LANGUAGES) {
      const adapter = await loadTask3Adapter(language);
      const emptyDoc = adapter.starterCode.before + adapter.starterCode.after;
      const result = adapter.validate(emptyDoc);

      expect(result.passed).toBe(false);
      for (const check of result.checks) {
        expect(check.message).not.toContain(adapter.solutionEditable.trim());
      }
    }
  });
});
