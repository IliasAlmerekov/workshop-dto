import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Task1Runner } from "./Task1Runner";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import { WorkshopProvider } from "@/lib/workshop/WorkshopContext";
import { loadState } from "@/lib/workshop/storage";
import { typescriptAdapter } from "@/lib/exercises/adapters/typescript";

// CodeMirror's real editing surface is a contenteditable div, not something
// userEvent.type can drive meaningfully in jsdom, and its restricted-editing
// mechanics already have dedicated coverage in restrictedEditing.test.ts.
// This stub keeps the same prop contract so everything ELSE Task1Runner does
// (adapter loading, Check/Continue, hints, Insert solution, persistence) is
// exercised for real.
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

beforeEach(() => {
  window.localStorage.clear();
});

async function getEditableTextarea() {
  return (await screen.findByLabelText(
    /your solution for typed request dto/i,
  )) as HTMLTextAreaElement;
}

describe("Task1Runner", () => {
  it("shows a loading state, then the exercise once the adapter loads", async () => {
    renderWithWorkshop(<Task1Runner language="typescript" />);

    expect(screen.getByText(/loading exercise/i)).toBeInTheDocument();
    await screen.findByRole("heading", { name: "Typed Request DTO" });
  });

  it("Check solution reports real per-field feedback for an incomplete draft, and Continue stays locked", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Task1Runner language="typescript" />);

    await screen.findByRole("heading", { name: "Typed Request DTO" });
    await user.click(screen.getByRole("button", { name: /check solution/i }));

    // The untouched starter code has no fields yet, so every field check fails.
    expect(
      await screen.findByText(/userName is missing from the request/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Check solution passes and unlocks Continue for a correct solution", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Task1Runner language="typescript" />);

    const editor = await getEditableTextarea();
    await user.clear(editor);
    await user.type(
      editor,
      "readonly userName: string; readonly firstName: string; readonly lastName: string; readonly birthDate: Date; readonly email: string;",
    );

    await user.click(screen.getByRole("button", { name: /check solution/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
    );
    expect(screen.getByText(/DTO, not the domain entity/i)).toBeInTheDocument();
  });

  it("re-locks Continue after the draft is edited again post-check", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Task1Runner language="typescript" />);

    const editor = await getEditableTextarea();
    await user.clear(editor);
    await user.type(
      editor,
      "readonly userName: string; readonly firstName: string; readonly lastName: string; readonly birthDate: Date; readonly email: string;",
    );
    await user.click(screen.getByRole("button", { name: /check solution/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
    );

    await user.type(editor, " ");
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Continue calls completeTask, persisting completion", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Task1Runner language="typescript" />);

    const editor = await getEditableTextarea();
    await user.clear(editor);
    await user.type(
      editor,
      "readonly userName: string; readonly firstName: string; readonly lastName: string; readonly birthDate: Date; readonly email: string;",
    );
    await user.click(screen.getByRole("button", { name: /check solution/i }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(loadState().tasks["request-dto"].completed).toBe(true),
    );
  });

  it("reveals hints progressively and persists how many have been used", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Task1Runner language="typescript" />);

    await screen.findByRole("heading", { name: "Typed Request DTO" });
    expect(
      screen.queryByText(/DTO, not the domain entity/i),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await waitFor(() =>
      expect(loadState().tasks["request-dto"].hintsUsed).toBe(1),
    );
    expect(
      screen.getByText(typescriptAdapter.hints[0].text),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await waitFor(() =>
      expect(loadState().tasks["request-dto"].hintsUsed).toBe(3),
    );
    expect(
      screen.getByText(typescriptAdapter.hints[2].text),
    ).toBeInTheDocument();

    // All three cards shown — the action now becomes "Insert solution".
    expect(
      screen.queryByRole("button", { name: /show hint/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /insert solution/i }),
    ).toBeInTheDocument();
  });

  it("Insert solution fills the editor, validates, and unlocks Continue with an explanation", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<Task1Runner language="typescript" />);

    await screen.findByRole("heading", { name: "Typed Request DTO" });
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
    expect(screen.getByText(/DTO, not the domain entity/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(loadState().tasks["request-dto"].completed).toBe(true),
    );
  });

  it("does not resolve the previous language's adapter after switching languages", async () => {
    const { rerender } = renderWithWorkshop(
      <Task1Runner language="typescript" />,
    );
    await screen.findByRole("heading", { name: "Typed Request DTO" });

    rerender(
      <WorkshopProvider>
        <Task1Runner language="java" />
      </WorkshopProvider>,
    );

    // The Java file name should show up (in both the task-field summary and
    // the stub editor's fileName prop), not TypeScript's, anywhere.
    await waitFor(() =>
      expect(
        screen.getAllByText("CreateUserRequest.java").length,
      ).toBeGreaterThan(0),
    );
    expect(screen.queryAllByText("CreateUserRequest.ts")).toHaveLength(0);
  });
});
