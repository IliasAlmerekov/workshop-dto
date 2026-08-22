import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import WorkshopPage from "./page";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import { saveState, createDefaultState } from "@/lib/workshop/storage";

const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}));

vi.mock("@/lib/config", () => ({ API_BASE_URL: "http://localhost:8000" }));

beforeEach(() => {
  window.localStorage.clear();
  replace.mockClear();
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ status: "ok" }) }),
  );
});

describe("Workshop page", () => {
  it("redirects to the landing page when no language has been chosen yet", async () => {
    renderWithWorkshop(<WorkshopPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
  });

  it("renders the header and the active exercise once a language is set", async () => {
    const seeded = createDefaultState();
    seeded.language = "php";
    saveState(seeded);

    renderWithWorkshop(<WorkshopPage />);

    await screen.findByRole("heading", { name: "Typed Request DTO" });
    expect(
      screen.getByRole("button", { name: /reset workshop/i }),
    ).toBeInTheDocument();
    expect(replace).not.toHaveBeenCalled();
  });

  it("has no automatically detectable accessibility violations (spec 16, issue #13)", async () => {
    const seeded = createDefaultState();
    seeded.language = "php";
    saveState(seeded);

    const { container } = renderWithWorkshop(<WorkshopPage />);
    await screen.findByRole("heading", { name: "Typed Request DTO" });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
