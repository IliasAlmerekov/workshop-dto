import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { HealthStatus } from "./HealthStatus";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("HealthStatus", () => {
  it("renders nothing while the API is healthy", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok" }),
      }),
    );

    render(<HealthStatus />);

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled());
    expect(screen.queryByTestId("health-status")).not.toBeInTheDocument();
  });

  it("shows a waking-up state when the API cannot be reached", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );

    render(<HealthStatus />);

    await waitFor(() =>
      expect(screen.getByTestId("health-status")).toHaveTextContent(
        /waking up the demo api/i,
      ),
    );
  });

  it("shows the waking-up state when the API answers with an unexpected payload", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }),
    );

    render(<HealthStatus />);

    await waitFor(() =>
      expect(screen.getByTestId("health-status")).toBeInTheDocument(),
    );
  });
});
