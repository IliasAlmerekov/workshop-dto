import { describe, expect, it } from "vitest";
import { LANGUAGES } from "@/lib/workshop/types";
import { loadTask1Adapter } from "./task1Adapters";
import { TASK1_REQUIRED_FIELDS } from "./task1";

describe("loadTask1Adapter", () => {
  it.each(LANGUAGES)("loads a working adapter for %s", async (language) => {
    const adapter = await loadTask1Adapter(language);
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

    // Every required field has its own check id, so feedback can point at
    // the specific rule that failed (spec 7.4) without ever being purely
    // "pass"/"fail" for the whole task.
    for (const field of TASK1_REQUIRED_FIELDS) {
      expect(result.checks.some((c) => c.id === `field-${field.name}`)).toBe(
        true,
      );
    }

    // Three progressive hint cards before "Insert solution" (spec 7.3).
    expect(adapter.hints).toHaveLength(3);
    expect(adapter.hints[0].kind).toBe("concept");
    expect(adapter.hints[1].kind).toBe("fields");
    expect(adapter.hints[2].kind).toBe("syntax");
  });

  it("never returns hidden solution text for a failed check message", async () => {
    for (const language of LANGUAGES) {
      const adapter = await loadTask1Adapter(language);
      const emptyDoc = adapter.starterCode.before + adapter.starterCode.after;
      const result = adapter.validate(emptyDoc);

      expect(result.passed).toBe(false);
      for (const check of result.checks) {
        expect(check.message).not.toContain(adapter.solutionEditable.trim());
      }
    }
  });
});
