"use client";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/config";

type HealthState =
  | { status: "loading" }
  | { status: "ok" }
  | { status: "error"; message: string };

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

  return (
    <p data-testid="health-status">
      Symfony API status: {health.status === "loading" && "checking…"}
      {health.status === "ok" && "ok"}
      {health.status === "error" && `unreachable (${health.message})`}
    </p>
  );
}
