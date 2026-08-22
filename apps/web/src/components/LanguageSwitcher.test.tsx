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

function seedLanguage(language: "typescript" | "php") {
  const seeded = createDefaultState();
  seeded.language = language;
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
    seedLanguage("typescript");
    const user = userEvent.setup();
    renderWithWorkshop(
      <>
        <LanguageSwitcher />
        <ActiveExerciseCard />
      </>,
    );

    const editor = await screen.findByLabelText(/your solution/i);
    expect(editor).toHaveValue(starterCode("request-dto", "typescript"));

    await user.selectOptions(
      screen.getByLabelText("Programming language"),
      "java",
    );

    await waitFor(() => expect(loadState().language).toBe("java"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    // The editor now shows the Java starter code instead.
    await waitFor(() =>
      expect(screen.getByLabelText(/your solution/i)).toHaveValue(
        starterCode("request-dto", "java"),
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
    expect(loadState().tasks["request-dto"].draft).toBe("");
    expect(loadState().tasks["request-dto"].touched).toBe(false);
    await waitFor(() =>
      expect(screen.getByLabelText(/your solution/i)).toHaveValue(
        starterCode("request-dto", "java"),
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
    expect(loadState().tasks["request-dto"].draft).toBe("work in progress");
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
      expect(loadState().tasks["request-dto"].completed).toBe(true),
    );

    const editor = await screen.findByLabelText(/your solution/i);
    await user.clear(editor);
    await user.type(editor, "second task draft");
    await waitFor(() =>
      expect(loadState().tasks["request-mapper"].draft).toBe(
        "second task draft",
      ),
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
    expect(loadState().tasks["request-dto"].completed).toBe(true);
    expect(loadState().tasks["request-mapper"].draft).toBe("");
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
        starterCode("request-dto", "java"),
      ),
    );
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });
});
