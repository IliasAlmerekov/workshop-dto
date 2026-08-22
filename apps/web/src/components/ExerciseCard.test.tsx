import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExerciseCard } from "./ExerciseCard";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import { useWorkshop } from "@/lib/workshop/WorkshopContext";
import { loadState } from "@/lib/workshop/storage";
import { starterCode } from "@/lib/workshop/starterCode";
import { taskDefinition } from "@/lib/workshop/tasks";
import type { Language, TaskId } from "@/lib/workshop/types";

// All four real tasks (request-dto, request-mapper, external-api,
// response-dto) now run on the real CodeMirror-based ExerciseRunner (see
// ExerciseRunner.test.tsx) — there is no longer a placeholder task reachable
// through ActiveExerciseCard's routing. ExerciseCard itself remains the
// fallback for any future task without a real adapter, so it's tested
// directly here — via this harness, which reads progress reactively from
// context the same way ActiveExerciseCard would, rather than via a static
// prop that would never reflect the participant's edits.
function ExerciseCardHarness({
  taskId,
  language,
}: {
  taskId: TaskId;
  language: Language;
}) {
  const { state } = useWorkshop();
  return (
    <ExerciseCard
      task={taskDefinition(taskId)}
      progress={state.tasks[taskId]}
      language={language}
    />
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("ExerciseCard", () => {
  it("shows the track's starter code while the task is untouched", async () => {
    renderWithWorkshop(
      <ExerciseCardHarness taskId="request-dto" language="typescript" />,
    );

    const editor = await screen.findByLabelText(/your solution/i);
    expect(editor).toHaveValue(starterCode("request-dto", "typescript"));
    // Showing starter code must not mark the task as touched.
    expect(loadState().tasks["request-dto"].touched).toBe(false);
  });

  it("persists draft edits for the active task", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseCardHarness taskId="request-dto" language="typescript" />,
    );

    const editor = await screen.findByLabelText(/your solution/i);
    await user.clear(editor);
    await user.type(editor, "my own solution");

    await waitFor(() =>
      expect(loadState().tasks["request-dto"].draft).toBe("my own solution"),
    );
    expect(loadState().tasks["request-dto"].touched).toBe(true);
  });

  it("keeps a deliberately emptied editor empty", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseCardHarness taskId="request-dto" language="typescript" />,
    );

    const editor = await screen.findByLabelText(/your solution/i);
    await user.clear(editor);

    await waitFor(() => expect(editor).toHaveValue(""));
    expect(loadState().tasks["request-dto"].touched).toBe(true);
  });

  it("keeps Continue disabled until Check solution is clicked", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseCardHarness taskId="request-dto" language="typescript" />,
    );

    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: /check solution/i }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("re-locks Continue after the draft is edited again", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseCardHarness taskId="request-dto" language="typescript" />,
    );

    await user.click(screen.getByRole("button", { name: /check solution/i }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();

    await user.type(screen.getByLabelText(/your solution/i), "x");
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Continue marks the task complete", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseCardHarness taskId="request-dto" language="typescript" />,
    );

    await user.click(screen.getByRole("button", { name: /check solution/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));

    await waitFor(() =>
      expect(loadState().tasks["request-dto"].completed).toBe(true),
    );
  });

  it("shows a placeholder hint note when Show hint is clicked", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseCardHarness taskId="request-dto" language="typescript" />,
    );

    expect(
      screen.queryByText(/progressive hints for this exercise/i),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    expect(
      screen.getByText(/progressive hints for this exercise/i),
    ).toBeInTheDocument();
  });
});
