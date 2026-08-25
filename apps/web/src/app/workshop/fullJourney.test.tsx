import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WorkshopPage from "./page";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import {
  loadState,
  saveState,
  createDefaultState,
} from "@/lib/workshop/storage";
import { LANGUAGES } from "@/lib/workshop/types";

/**
 * Issue #8 ("Integrate and verify all four language tracks"): proves the
 * four exercises work as one reliable sequential journey, not just as
 * isolated units — for every language track, not just one. Runs the real
 * WorkshopPage end to end: strict in-order unlocking (spec 16.3), Insert
 * solution as an explained completion rather than a skip (spec 16.5), and
 * the final "all four complete" screen (spec 7.5) all fall out of this one
 * pass rather than being asserted piecemeal.
 */
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// CodeMirror's real editing surface is a contenteditable div — not
// something userEvent can drive meaningfully in jsdom — and its own
// mechanics are covered elsewhere (restrictedEditing.test.ts,
// ExerciseRunner.test.tsx). This stub keeps the same prop contract.
vi.mock("@/components/CodeMirrorEditor", () => ({
  CodeMirrorEditor: ({
    fileName,
    label,
  }: {
    fileName: string;
    editable: string;
    onEditableChange: (text: string) => void;
    label: string;
  }) => (
    <div>
      <span>{fileName}</span>
      <label htmlFor="stub-editor">{label}</label>
      <textarea id="stub-editor" readOnly />
    </div>
  ),
}));

const TASK_HEADINGS = [
  "Typed Request DTO",
  "Request Mapper",
  "Welcome Email DTO",
  "Welcome Email Mapper",
  "Registration Response DTO",
  "Registration Response Mapper",
];

beforeEach(() => {
  window.localStorage.clear();
  // Task 4's success panel calls the real demo API (spec 6.4) — stubbed
  // here the same way page.test.tsx already does, since this test only
  // cares about the exercise journey, not the live API integration (which
  // issue #7 verified against a real running backend).
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue({ ok: true, json: async () => ({ status: "ok" }) }),
  );
});

describe.each(LANGUAGES)("full workshop journey — %s", (language) => {
  it("unlocks all six registration stages strictly in order via Insert solution", async () => {
    const seeded = createDefaultState();
    seeded.language = language;
    saveState(seeded);

    const user = userEvent.setup();
    renderWithWorkshop(<WorkshopPage />);

    for (const heading of TASK_HEADINGS) {
      await screen.findByRole("heading", { name: heading });

      // Insert solution never silently skips: it fills the real solution,
      // re-validates it, and only then Continue unlocks (spec 7.3/16.5).
      expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

      await user.click(screen.getByRole("button", { name: /show hint/i }));
      await user.click(
        await screen.findByRole("button", { name: /next hint/i }),
      );
      await user.click(
        await screen.findByRole("button", { name: /next hint/i }),
      );
      await user.click(
        screen.getByRole("button", { name: /insert solution/i }),
      );

      await waitFor(() =>
        expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
      );
      // The checks driving Continue are real, not a rubber stamp: the result
      // column reports every rule as passed in words, not by colour alone.
      expect(screen.getByText("All checks passed")).toBeInTheDocument();
      expect(screen.getAllByText("Passed").length).toBeGreaterThan(0);

      await user.click(screen.getByRole("button", { name: /continue/i }));
    }

    await screen.findByText(/All six registration stages complete/i);

    const finalState = loadState();
    for (const taskId of [
      "request-dto",
      "request-mapper",
      "welcome-email-dto",
      "welcome-email-mapper",
      "registration-response-dto",
      "registration-response-mapper",
    ] as const) {
      expect(finalState.tasks[taskId].completed).toBe(true);
    }
    expect(finalState.language).toBe(language);

    // The stepper (the only navigation control across tasks) is gone once
    // the journey is complete — nothing is left to jump back into a
    // completed task with. Checking for its role rather than matching task
    // title text avoids false positives against unrelated content (e.g. the
    // completion screen's knowledge check, which legitimately mentions the
    // same boundary names in its answer options).
    expect(
      screen.queryByRole("list", { name: /exercise progress/i }),
    ).not.toBeInTheDocument();
  });
});
