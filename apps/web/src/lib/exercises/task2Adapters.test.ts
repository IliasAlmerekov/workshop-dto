import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@/lib/workshop/types";
import { loadTask2Adapter } from "./task2Adapters";
import { TASK2_FIELDS } from "./task2";

describe("loadTask2Adapter", () => {
  it.each(LANGUAGES)("loads a working adapter for %s", async (language) => {
    const adapter = await loadTask2Adapter(language);
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

    // Every field has at least a source-mapping check, so feedback can point
    // at the specific transformation that's missing (spec 7.4).
    for (const field of TASK2_FIELDS) {
      expect(
        result.checks.some((c) => c.id === `field-${field.outputName}-source`),
      ).toBe(true);
    }

    // Three progressive hint cards before "Insert solution" (spec 7.3).
    expect(adapter.hints).toHaveLength(3);
    expect(adapter.hints[0].kind).toBe("concept");
    expect(adapter.hints[1].kind).toBe("fields");
    expect(adapter.hints[2].kind).toBe("syntax");
  });

  it("never returns hidden solution text for a failed check message", async () => {
    for (const language of LANGUAGES) {
      const adapter = await loadTask2Adapter(language);
      const emptyDoc = adapter.starterCode.before + adapter.starterCode.after;
      const result = adapter.validate(emptyDoc);

      expect(result.passed).toBe(false);
      for (const check of result.checks) {
        expect(check.message).not.toContain(adapter.solutionEditable.trim());
      }
    }
  });
});
