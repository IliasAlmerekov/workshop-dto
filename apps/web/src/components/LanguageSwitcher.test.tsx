import { beforeEach, describe, expect, it } from "vitest";
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
import { starterCode } from "@/lib/workshop/starterCode";

// These tests exercise the language-switch mechanic itself (confirmation,
// draft-clearing, re-locking Continue) generically — not tasks 1-2
// specifically, which have their own real CodeMirror runner covered by
// ExerciseRunner.test.tsx. Seeding request-dto and request-mapper as already
// complete makes external-api (still on the simpler placeholder flow) the
// active task, so these tests don't need to deal with async adapter/grammar
// loading at all.
function seedLanguage(language: "typescript" | "php") {
  const seeded = createDefaultState();
  seeded.language = language;
  seeded.tasks["request-dto"].completed = true;
  seeded.tasks["request-mapper"].completed = true;
  saveState(seeded);
}

async function typeOwnDraft(
  user: ReturnType<typeof userEvent.setup>,
  text: string,
) {
  const editor = await screen.findByLabelText(/your solution/i);
  await user.clear(editor);
  await user.type(editor, text);
  await waitFor(() =>
    expect(loadState().tasks["external-api"].draft).toBe(text),
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
    seedLanguage("typescript");
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    const editor = await screen.findByLabelText(/your solution/i);
    expect(editor).toHaveValue(starterCode("external-api", "typescript"));

    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "java",
    );

    await waitFor(() => expect(loadState().language).toBe("java"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // The editor now shows the Java starter code instead.
    await waitFor(() =>
      expect(screen.getByLabelText(/your solution/i)).toHaveValue(
        starterCode("external-api", "java"),
      ),
    );
  });

  it("asks for confirmation and clears only the active draft when switching mid-task", async () => {
    seedLanguage("typescript");
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
    expect(loadState().tasks["external-api"].draft).toBe("");
    expect(loadState().tasks["external-api"].touched).toBe(false);
    await waitFor(() =>
      expect(screen.getByLabelText(/your solution/i)).toHaveValue(
        starterCode("external-api", "java"),
      ),
    );
  });

  it("keeps the current language and draft when the switch is cancelled", async () => {
    seedLanguage("typescript");
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
    expect(loadState().tasks["external-api"].draft).toBe("work in progress");
  });

  it("leaves completed tasks untouched across a confirmed language switch", async () => {
    seedLanguage("typescript");
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    await user.click(screen.getByRole("button", { name: /check solution/i }));
    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(loadState().tasks["external-api"].completed).toBe(true),
    );

    const editor = await screen.findByLabelText(/your solution/i);
    await user.clear(editor);
    await user.type(editor, "fourth task draft");
    await waitFor(() =>
      expect(loadState().tasks["response-dto"].draft).toBe("fourth task draft"),
    );

    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "python",
    );
    const dialog = await screen.findByRole("dialog");
    await user.click(
      within(dialog).getByRole("button", { name: /switch and clear draft/i }),
    );

    await waitFor(() => expect(loadState().language).toBe("python"));
    expect(loadState().tasks["external-api"].completed).toBe(true);
    expect(loadState().tasks["response-dto"].draft).toBe("");
  });

  it("re-locks Continue after a language switch, even without touching the new editor", async () => {
    seedLanguage("typescript");
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    await user.click(screen.getByRole("button", { name: /check solution/i }));
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();

    // Untouched starter code, so this switch needs no confirmation dialog.
    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "java",
    );

    await waitFor(() =>
      expect(screen.getByLabelText(/your solution/i)).toHaveValue(
        starterCode("external-api", "java"),
      ),
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});
