import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import Home from "./page";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import { loadState } from "@/lib/workshop/storage";
import { HERO_TRANSITION_MS } from "@/components/hero/heroMotion";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn() }),
}));

vi.mock("@/lib/config", () => ({ API_BASE_URL: "http://localhost:8000" }));

beforeEach(() => {
  vi.useRealTimers();
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

  it("starts the selected language directly from its card", async () => {
    vi.useFakeTimers();
    renderWithWorkshop(<Home />);

    fireEvent.click(screen.getByRole("radio", { name: "TypeScript" }));
    expect(push).not.toHaveBeenCalled();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(HERO_TRANSITION_MS);
    });
    expect(push).toHaveBeenCalledWith("/workshop");
    vi.useRealTimers();
  });

  it("previews the hovered language on the Request DTO without navigating", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Home />);

    const preview = screen.getByTestId("hero-track-preview");
    // Every language is mounted so they can cross-fade, so text content alone
    // cannot say which one the card reads. `data-live` names it.
    const liveTracks = () =>
      Array.from(
        preview.querySelectorAll('[data-track][data-live="true"]'),
        (node) => node.getAttribute("data-track"),
      );

    await user.hover(screen.getByRole("radio", { name: "Java" }));
    expect(preview).toHaveAttribute("data-layer-index", "0");
    expect(liveTracks()).toEqual(["java", "java"]);

    await user.unhover(screen.getByRole("radio", { name: "Java" }));
    await user.hover(screen.getByRole("radio", { name: "Python" }));
    // The card names the language but never leaves the Request DTO: the accent
    // belongs to the boundary every track writes first, not to the language.
    expect(preview).toHaveAttribute("data-layer-index", "0");
    expect(liveTracks()).toEqual(["python", "python"]);
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps auxiliary actions and API status outside the Figma-owned hero", () => {
    renderWithWorkshop(<Home />);

    expect(screen.queryByText("Start without login")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Pick a language above to begin."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Waking up the demo API/),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Why DTOs and Mappers exist"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("See a real entity leak vs. a safe DTO response"),
    ).not.toBeInTheDocument();
  });

  it("persists the chosen language so it survives a reload", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Home />);

    await user.click(screen.getByRole("radio", { name: "Python" }));
    await waitFor(() => expect(loadState().language).toBe("python"));
  });

  it("has no automatically detectable accessibility violations (spec 16, issue #13)", async () => {
    const { container } = renderWithWorkshop(<Home />);
    await screen.findByRole("radiogroup", {
      name: "Choose your programming language",
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
