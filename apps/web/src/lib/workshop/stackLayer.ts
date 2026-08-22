import type { StackLayer } from "@/components/IsometricStack";
import type { TaskId } from "./types";

/**
 * Maps each exercise to the pipeline stage it visually represents. Not a
 * 1:1 name match — the four pipeline stages (spec 5.3: Entity → Mapper →
 * DTO) are the conceptual stations, while the four exercises are individual
 * lessons about the boundaries between them. Exercise 3 ("External API DTO
 * and Mapper") is the boundary where the pipeline receives from the
 * external Entity-shaped identity response, hence "Entity" here.
 */
const TASK_TO_LAYER: Record<TaskId, StackLayer> = {
  "request-dto": "Request DTO",
  "request-mapper": "Mapper",
  "external-api": "Entity",
  "response-dto": "Response DTO",
};

export function stackLayerForTask(taskId: TaskId): StackLayer {
  return TASK_TO_LAYER[taskId];
}
