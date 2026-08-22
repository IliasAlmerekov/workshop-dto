import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "./page";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import { loadState } from "@/lib/workshop/storage";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/lib/config", () => ({ API_BASE_URL: "http://localhost:8000" }));

beforeEach(() => {
  window.localStorage.clear();
  push.mockClear();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ status: "ok" }) }),
  );
});

describe("Landing page", () => {
  it("requires no login and offers all four language tracks", () => {
    renderWithWorkshop(<Home />);

    expect(screen.queryByLabelText(/password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    ["PHP", "TypeScript", "Python", "Java"].forEach((label) => {
      expect(screen.getByRole("radio", { name: label })).toBeInTheDocument();
    });
  });

  it("disables the start button until a language is chosen, then navigates to /workshop", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Home />);

    const startButton = await screen.findByRole("button", {
      name: /start without login/i,
    });
    expect(startButton).toBeDisabled();

    await user.click(screen.getByRole("radio", { name: "TypeScript" }));
    await waitFor(() => expect(startButton).toBeEnabled());

    await user.click(startButton);
    expect(push).toHaveBeenCalledWith("/workshop");
  });

  it("persists the chosen language so it survives a reload", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Home />);

    await user.click(screen.getByRole("radio", { name: "Python" }));
    await waitFor(() => expect(loadState().language).toBe("python"));
  });
});
