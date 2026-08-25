import type { StackLayer } from "@/components/IsometricStack";
import type { TaskId } from "./types";

/**
 * Maps each exercise to the pipeline stage it visually represents. Not a
 * 1:1 name match — the illustration has four conceptual layers while the
 * registration story has six learning steps. DTOs occupy their contract
 * layer; each mapper occupies the transformation layer it teaches.
 */
const TASK_TO_LAYER: Record<TaskId, StackLayer> = {
  "request-dto": "Request DTO",
  "request-mapper": "Mapper",
  "welcome-email-dto": "Entity",
  "welcome-email-mapper": "Mapper",
  "registration-response-dto": "Response DTO",
  "registration-response-mapper": "Response DTO",
};

export function stackLayerForTask(taskId: TaskId): StackLayer {
  return TASK_TO_LAYER[taskId];
}
