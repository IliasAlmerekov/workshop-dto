"use client";

import { JsonEndpointPanel } from "./JsonEndpointPanel";
import { API_BASE_URL } from "@/lib/config";
import { useMessages } from "@/lib/i18n";

/**
 * Shown once Task 4 (Response DTO and Entity Mapper) passes (spec section
 * 6.4's "successful completion reveals the live Entity-versus-DTO
 * comparison"). Reuses the same real-API panels as the standalone /demo
 * page rather than duplicating the fetch/leak-detection logic.
 */
export function EntityDtoComparisonPanel() {
  const messages = useMessages();

  return (
    <div className="flex flex-col gap-4 border-t border-[var(--border)] pt-6">
      <div>
        <p className="text-sm font-semibold">{messages.comparison.heading}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {messages.comparison.body}
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <JsonEndpointPanel
          title={messages.jsonPanel.entityTitle}
          description={messages.jsonPanel.entityDescription}
          path="/api/demo/users/7/entity"
          url={`${API_BASE_URL}/api/demo/users/7/entity`}
          tone="warning"
          flagFields={["passwordHash", "internalNote"]}
        />
        <JsonEndpointPanel
          title={messages.jsonPanel.dtoTitle}
          description={messages.jsonPanel.dtoDescription}
          path="/api/demo/users/7/dto"
          url={`${API_BASE_URL}/api/demo/users/7/dto`}
          tone="safe"
        />
      </div>
    </div>
  );
}
