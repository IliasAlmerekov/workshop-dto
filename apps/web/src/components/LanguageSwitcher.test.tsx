import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ActiveExerciseCard } from "./ActiveExerciseCard";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import {
  loadState,
  saveState,
  createDefaultState,
} from "@/lib/workshop/storage";
import { TASK1_STARTER_CODE } from "@/lib/exercises/task1StarterCode";
import { typescriptAdapter } from "@/lib/exercises/adapters/typescript";

// These tests exercise the language-switch mechanic itself (confirmation,
// draft-clearing, re-locking Continue) against the real CodeMirror-based
// ExerciseRunner — every task is real now (issues #4-#7), so there is no
// placeholder task left to land tests on. A fresh default state (with a
// language selected) lands on task 1 (request-dto) directly.
function seedTypescript() {
  const seeded = createDefaultState();
  seeded.language = "typescript";
  saveState(seeded);
}
vi.mock("./CodeMirrorEditor", () => ({
  CodeMirrorEditor: ({
    fileName,
    editable,
    onEditableChange,
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
      <textarea
        id="stub-editor"
        value={editable}
        onChange={(event) => onEditableChange(event.target.value)}
      />
    </div>
  ),
}));

async function typeOwnDraft(
  user: ReturnType<typeof userEvent.setup>,
  text: string,
) {
  const editor = await screen.findByLabelText(/your solution/i);
  await user.clear(editor);
  await user.type(editor, text);
  await waitFor(() =>
    expect(loadState().tasks["request-dto"].draft).toBe(text),
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("LanguageSwitcher", () => {
  it("switches immediately when there is no active draft", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<LanguageSwitcher />);

    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "python",
    );

    await waitFor(() => expect(loadState().language).toBe("python"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("switches without asking while the editor still holds untouched starter code", async () => {
    seedTypescript();
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    const editor = await screen.findByLabelText(/your solution/i);
    expect(editor).toHaveValue(TASK1_STARTER_CODE.typescript.editable);

    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "java",
    );

    await waitFor(() => expect(loadState().language).toBe("java"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // The editor now shows the Java starter code instead.
    await waitFor(() =>
      expect(screen.getByLabelText(/your solution/i)).toHaveValue(
        TASK1_STARTER_CODE.java.editable,
      ),
    );
  });

  it("asks for confirmation and clears only the active draft when switching mid-task", async () => {
    seedTypescript();
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    await typeOwnDraft(user, "some in-progress code");

    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "java",
    );

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText(/switch language/i)).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: /switch and clear draft/i }),
    );

    await waitFor(() => expect(loadState().language).toBe("java"));
    expect(loadState().tasks["request-dto"].draft).toBe("");
    expect(loadState().tasks["request-dto"].touched).toBe(false);
    await waitFor(() =>
      expect(screen.getByLabelText(/your solution/i)).toHaveValue(
        TASK1_STARTER_CODE.java.editable,
      ),
    );
  });

  it("keeps the current language and draft when the switch is cancelled", async () => {
    seedTypescript();
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    await typeOwnDraft(user, "work in progress");

    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "java",
    );

    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /keep current draft/i }),
    );

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(loadState().language).toBe("typescript");
    expect(loadState().tasks["request-dto"].draft).toBe("work in progress");
  });

  it("leaves completed tasks untouched across a confirmed language switch", async () => {
    seedTypescript();
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    await screen.findByLabelText(/your solution/i);
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /insert solution/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(loadState().tasks["request-dto"].completed).toBe(true),
    );

    // Now on task 2 (request-mapper) with its own untouched starter code.
    await screen.findByRole("heading", { name: "Request Mapper" });

    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "python",
    );

    await waitFor(() => expect(loadState().language).toBe("python"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(loadState().tasks["request-dto"].completed).toBe(true);
  });

  it("re-locks Continue after a language switch, even without touching the new editor", async () => {
    seedTypescript();
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    await screen.findByLabelText(/your solution/i);
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /insert solution/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
    );
    expect(loadState().tasks["request-dto"].draft).toBe(
      typescriptAdapter.solutionEditable,
    );

    // A solved draft still counts as an active draft, so switching prompts
    // for confirmation before it's cleared.
    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "java",
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /switch and clear draft/i }),
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/your solution/i)).toHaveValue(
        TASK1_STARTER_CODE.java.editable,
      ),
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});
