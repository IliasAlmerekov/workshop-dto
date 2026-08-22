import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { HealthStatus } from "./HealthStatus";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HealthStatus", () => {
  it("shows ok once the API reports a healthy status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok" }),
      }),
    );

    render(<HealthStatus />);

    await waitFor(() =>
      expect(screen.getByTestId("health-status")).toHaveTextContent(
        "Symfony API status: ok",
      ),
    );
  });

  it("shows an unreachable state when the API request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    render(<HealthStatus />);

    await waitFor(() =>
      expect(screen.getByTestId("health-status")).toHaveTextContent(
        "unreachable (network down)",
      ),
    );
  });
});
