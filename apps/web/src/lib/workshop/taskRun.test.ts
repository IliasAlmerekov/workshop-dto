import { describe, expect, it } from "vitest";
import { runTask } from "./taskRun";
import { TASK_IDS } from "./types";
import { TASK2_LEGACY_REGISTRATION_PAYLOAD } from "@/lib/exercises/task2";
import { TASK4_FORBIDDEN_FIELDS } from "@/lib/exercises/task4";

describe("runTask", () => {
  it.each(TASK_IDS)("produces a named output with fields for %s", (taskId) => {
    const run = runTask(taskId);

    expect(run.outputName).toBeTruthy();
    expect(run.fields.length).toBeGreaterThan(0);
    expect(run.input).toBeDefined();
  });

  it("normalizes the request mapper's legacy registration payload the way the task describes", () => {
    const run = runTask("request-mapper");
    const byKey = Object.fromEntries(run.fields.map((f) => [f.key, f]));

    // The legacy payload really is untrimmed and mis-cased — otherwise the
    // assertions below would pass for the wrong reason.
    expect(TASK2_LEGACY_REGISTRATION_PAYLOAD.user_name).not.toBe(
      TASK2_LEGACY_REGISTRATION_PAYLOAD.user_name.trim(),
    );

    expect(byKey.userName.value).toBe("ada.lovelace");
    expect(byKey.userName.transform).toContain("trimmed");
    expect(byKey.userName.transform).toContain("lowercased");
    expect(byKey.email.value).toBe("ada@example.test");
    expect(byKey.birthDate.kind).toBe("date");
  });

  it("prepares a welcome email from the created User without a side effect", () => {
    const run = runTask("welcome-email-mapper");
    const byKey = Object.fromEntries(run.fields.map((f) => [f.key, f]));

    expect(run.outputName).toBe("WelcomeEmail");
    expect(byKey.recipientEmail).toMatchObject({
      value: "ada@example.test",
      source: "email",
    });
    expect(byKey.recipientName).toMatchObject({ value: "Ada Lovelace" });
    expect(byKey.subject.transform).toContain("not sent");
  });

  it("never maps the entity's secret fields into the response", () => {
    const run = runTask("registration-response-mapper");
    const mappedKeys = run.fields.map((field) => field.key);
    const omittedKeys = run.omitted.map((field) => field.key);

    for (const forbidden of TASK4_FORBIDDEN_FIELDS) {
      expect(mappedKeys).not.toContain(forbidden);
      expect(omittedKeys).toContain(forbidden);
    }

    const byKey = Object.fromEntries(run.fields.map((f) => [f.key, f]));
    expect(byKey.displayName.value).toBe("Ada Lovelace");
    expect(byKey.birthDate.value).toBe("1815-12-10");
  });

  it("keeps no forbidden value in any produced field", () => {
    const run = runTask("registration-response-mapper");
    const rendered = run.fields.map((field) => field.value).join(" ");

    expect(rendered).not.toContain("argon2id");
    expect(rendered).not.toContain("VIP migration candidate");
  });
});
