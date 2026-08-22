import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@/lib/workshop/types";
import { loadTask4Adapter } from "./task4Adapters";
import { TASK4_FIELDS } from "./task4";

describe("loadTask4Adapter", () => {
  it.each(LANGUAGES)("loads a working adapter for %s", async (language) => {
    const adapter = await loadTask4Adapter(language);
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

    // Every field has appropriate checks, so feedback can point at the
    // specific rule that's missing (spec 7.4).
    for (const field of TASK4_FIELDS) {
      const hasFieldCheck = result.checks.some(
        (c) =>
          c.id === `field-${field.outputName}-source` ||
          c.id === `field-${field.outputName}-firstName`,
      );
      expect(hasFieldCheck).toBe(true);
    }

    // passwordHash and internalNote must never be exposed (spec 5.1/6.4).
    expect(result.checks.some((c) => c.id === "no-leak-passwordHash")).toBe(
      true,
    );
    expect(result.checks.some((c) => c.id === "no-leak-internalNote")).toBe(
      true,
    );

    // Three progressive hint cards before "Insert solution" (spec 7.3).
    expect(adapter.hints).toHaveLength(3);
    expect(adapter.hints[0].kind).toBe("concept");
    expect(adapter.hints[1].kind).toBe("fields");
    expect(adapter.hints[2].kind).toBe("syntax");
  });

  it("never returns hidden solution text for a failed check message", async () => {
    for (const language of LANGUAGES) {
      const adapter = await loadTask4Adapter(language);
      const emptyDoc = adapter.starterCode.before + adapter.starterCode.after;
      const result = adapter.validate(emptyDoc);

      expect(result.passed).toBe(false);
      for (const check of result.checks) {
        expect(check.message).not.toContain(adapter.solutionEditable.trim());
      }
    }
  });
});
