import { describe, expect, it } from "vitest";
import { stackLayerForTask } from "./stackLayer";
import { TASK_IDS } from "./types";

describe("stackLayerForTask", () => {
  it("maps every task id to a pipeline stage (spec 5.3: Entity → Mapper → DTO)", () => {
    expect(stackLayerForTask("request-dto")).toBe("Request DTO");
    expect(stackLayerForTask("request-mapper")).toBe("Mapper");
    expect(stackLayerForTask("welcome-email-dto")).toBe("Entity");
    expect(stackLayerForTask("welcome-email-mapper")).toBe("Mapper");
    expect(stackLayerForTask("registration-response-dto")).toBe("Response DTO");
    expect(stackLayerForTask("registration-response-mapper")).toBe(
      "Response DTO",
    );
  });

  it("has a mapping for every task id in the app, not just the four known today", () => {
    for (const taskId of TASK_IDS) {
      expect(stackLayerForTask(taskId)).toBeTruthy();
    }
  });
});
