import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActiveExerciseCard } from "./ActiveExerciseCard";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import {
  loadState,
  saveState,
  createDefaultState,
} from "@/lib/workshop/storage";
import { starterCode } from "@/lib/workshop/starterCode";

// Tasks 1-3 (request-dto, request-mapper, external-api) now run on the real
// CodeMirror-based ExerciseRunner (see ExerciseRunner.test.tsx) — these tests
// cover the older placeholder flow that task 4 still uses, so they seed all
// three real tasks as already complete to land on response-dto instead.
beforeEach(() => {
  window.localStorage.clear();
  const seeded = createDefaultState();
  seeded.language = "typescript";
  seeded.tasks["request-dto"].completed = true;
  seeded.tasks["request-mapper"].completed = true;
  seeded.tasks["external-api"].completed = true;
  saveState(seeded);
});

describe("ExerciseCard (via ActiveExerciseCard)", () => {
  it("shows the track's starter code while the task is untouched", async () => {
    renderWithWorkshop(<ActiveExerciseCard />);

    const editor = await screen.findByLabelText(/your solution/i);
    expect(editor).toHaveValue(starterCode("response-dto", "typescript"));
    // Showing starter code must not mark the task as touched.
    expect(loadState().tasks["response-dto"].touched).toBe(false);
  });

  it("persists draft edits for the active task", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<ActiveExerciseCard />);

    const editor = await screen.findByLabelText(/your solution/i);
    await user.clear(editor);
    await user.type(editor, "my own solution");

    await waitFor(() =>
      expect(loadState().tasks["response-dto"].draft).toBe("my own solution"),
    );
    expect(loadState().tasks["response-dto"].touched).toBe(true);
  });

  it("keeps a deliberately emptied editor empty", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<ActiveExerciseCard />);

    const editor = await screen.findByLabelText(/your solution/i);
    await user.clear(editor);

    await waitFor(() => expect(editor).toHaveValue(""));
    expect(loadState().tasks["response-dto"].touched).toBe(true);
  });

  it("keeps Continue disabled until Check solution is clicked", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<ActiveExerciseCard />);

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /check solution/i }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("re-locks Continue after the draft is edited again", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<ActiveExerciseCard />);

    await user.click(screen.getByRole("button", { name: /check solution/i }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();

    await user.type(screen.getByLabelText(/your solution/i), "x");
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Continue marks the task complete", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<ActiveExerciseCard />);

    await user.click(screen.getByRole("button", { name: /check solution/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(loadState().tasks["response-dto"].completed).toBe(true),
    );
  });

  it("shows a placeholder hint note when Show hint is clicked", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<ActiveExerciseCard />);

    expect(
      screen.queryByText(/progressive hints for this exercise/i),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    expect(
      screen.getByText(/progressive hints for this exercise/i),
    ).toBeInTheDocument();
  });
});
