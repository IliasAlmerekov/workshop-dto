"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

type HealthState =
  | { status: "loading" }
  | { status: "ok" }
  | { status: "error"; message: string };

/**
 * Surfaces the Symfony API's health, but only when something is wrong. A
 * healthy API renders nothing, so the workshop UI stays uncluttered; an
 * unreachable one shows the "waking up" state that a Render free-tier cold
 * start needs (spec section 12.4).
 */
export function HealthStatus() {
  const [health, setHealth] = useState<HealthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function checkHealth() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (!response.ok) {
          throw new Error(`Unexpected response status: ${response.status}`);
        }
        const data: unknown = await response.json();
        const isOk =
          typeof data === "object" &&
          data !== null &&
          "status" in data &&
          (data as { status: unknown }).status === "ok";

        if (!cancelled) {
          setHealth(
            isOk
              ? { status: "ok" }
              : { status: "error", message: "Unexpected response payload" },
          );
        }
      } catch (error) {
        if (!cancelled) {
          setHealth({
            status: "error",
            message: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    void checkHealth();

    return () => {
      cancelled = true;
    };
  }, []);

  if (health.status === "loading" || health.status === "ok") {
    return null;
  }

  return (
    <p
      role="status"
      data-testid="health-status"
      className="flex items-center gap-2 text-sm text-[var(--muted)]"
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
      />
      Waking up the demo API&hellip; exercises work without it.
    </p>
  );
}
