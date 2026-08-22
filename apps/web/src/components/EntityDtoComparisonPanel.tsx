import { JsonEndpointPanel } from "./JsonEndpointPanel";
import { API_BASE_URL } from "@/lib/config";

/**
 * Shown once Task 4 (Response DTO and Entity Mapper) passes (spec section
 * 6.4's "successful completion reveals the live Entity-versus-DTO
 * comparison"). Reuses the same real-API panels as the standalone /demo
 * page rather than duplicating the fetch/leak-detection logic.
 */
export function EntityDtoComparisonPanel() {
  return (
    <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-6">
      <div>
        <p className="text-sm font-semibold">
          See it live against the real Symfony API
        </p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Both panels call the real demo API for the same user. The left
          endpoint serializes the internal entity directly; the right one goes
          through the real <code className="font-mono">UserResponseMapper</code>{" "}
          your solution mirrors.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <JsonEndpointPanel
          title="Entity endpoint"
          description="Serializes the internal entity as-is."
          path="/api/demo/users/7/entity"
          url={`${API_BASE_URL}/api/demo/users/7/entity`}
          tone="warning"
          flagFields={["passwordHash", "internalNote"]}
        />
        <JsonEndpointPanel
          title="DTO endpoint"
          description="Mapped through UserResponseMapper — only what the client needs."
          path="/api/demo/users/7/dto"
          url={`${API_BASE_URL}/api/demo/users/7/dto`}
          tone="safe"
        />
      </div>
    </div>
  );
}
