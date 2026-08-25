import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { ExerciseRunner } from "./ExerciseRunner";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import { WorkshopProvider } from "@/lib/workshop/WorkshopContext";
import { loadState } from "@/lib/workshop/storage";
import { TASK1_DEFINITION } from "@/lib/exercises/task1";
import { loadTask1Adapter } from "@/lib/exercises/task1Adapters";
import { typescriptAdapter } from "@/lib/exercises/adapters/typescript";
import { TASK2_DEFINITION } from "@/lib/exercises/task2";
import { loadTask2Adapter } from "@/lib/exercises/task2Adapters";
import { typescriptMapperAdapter } from "@/lib/exercises/adapters/typescriptMapper";
import { TASK3_DEFINITION } from "@/lib/exercises/task3";
import { loadTask3Adapter } from "@/lib/exercises/task3Adapters";
import { typescriptIdentityMapperAdapter } from "@/lib/exercises/adapters/typescriptIdentityMapper";
import { TASK4_DEFINITION } from "@/lib/exercises/task4";
import { loadTask4Adapter } from "@/lib/exercises/task4Adapters";
import { typescriptResponseMapperAdapter } from "@/lib/exercises/adapters/typescriptResponseMapper";

// CodeMirror's real editing surface is a contenteditable div, not something
// userEvent.type can drive meaningfully in jsdom, and its restricted-editing
// mechanics already have dedicated coverage in restrictedEditing.test.ts.
// This stub keeps the same prop contract so everything ELSE ExerciseRunner
// does (adapter loading, Check/Continue, hints, Insert solution,
// persistence) is exercised for real.
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

describe("ExerciseRunner — Task 1 (request-dto)", () => {
  it("shows a loading state, then the exercise once the adapter loads", async () => {
    renderWithWorkshop(
      <ExerciseRunner
        taskId="request-dto"
        definition={TASK1_DEFINITION}
        loadAdapter={loadTask1Adapter}
        language="typescript"
      />,
    );

    expect(screen.getByText(/loading exercise/i)).toBeInTheDocument();
    await screen.findByRole("heading", { name: "Typed Request DTO" });
  });

  it("Check solution reports real per-field feedback for an incomplete draft, and Continue stays locked", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="request-dto"
        definition={TASK1_DEFINITION}
        loadAdapter={loadTask1Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "Typed Request DTO" });
    await user.click(screen.getByRole("button", { name: /check solution/i }));

    expect(
      await screen.findByText(/userName is missing from the request/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Check solution plays the validator's stages before the verdict, keeping Continue and the button locked meanwhile", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="request-dto"
        definition={TASK1_DEFINITION}
        loadAdapter={loadTask1Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "Typed Request DTO" });
    await user.click(screen.getByRole("button", { name: /check solution/i }));

    // The run is a reveal of a verdict already computed — while it plays,
    // neither the button nor Continue may be pressed again.
    const checking = screen.getByRole("button", { name: /checking/i });
    expect(checking).toBeDisabled();
    expect(checking).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText("Running checks")).toBeInTheDocument();
    expect(screen.getByText(/Parsing CreateUserRequest.ts/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();

    // …and once it settles, the stage list is gone and the real per-check
    // feedback has taken its place.
    expect(
      await screen.findByText(/userName is missing from the request/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("Running checks")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /check solution/i }),
    ).toBeEnabled();
  });

  it("Insert solution settles at once, without the staged run", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="request-dto"
        definition={TASK1_DEFINITION}
        loadAdapter={loadTask1Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "Typed Request DTO" });
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /insert solution/i }));

    expect(screen.queryByText("Running checks")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
  });

  it("Insert solution fills the editor, validates, and unlocks Continue with an explanation", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="request-dto"
        definition={TASK1_DEFINITION}
        loadAdapter={loadTask1Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "Typed Request DTO" });
    // Hints escalate inside the popover now: the trigger opens it on the
    // first hint, "Next hint" walks to the third, which unlocks the solution.
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
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
      <ExerciseRunner
        taskId="request-dto"
        definition={TASK1_DEFINITION}
        loadAdapter={loadTask1Adapter}
        language="typescript"
      />,
    );
    await screen.findByRole("heading", { name: "Typed Request DTO" });

    rerender(
      <WorkshopProvider>
        <ExerciseRunner
          taskId="request-dto"
          definition={TASK1_DEFINITION}
          loadAdapter={loadTask1Adapter}
          language="java"
        />
      </WorkshopProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getAllByText("CreateUserRequest.java").length,
      ).toBeGreaterThan(0),
    );
    expect(screen.queryAllByText("CreateUserRequest.ts")).toHaveLength(0);
  });

  it("has no automatically detectable accessibility violations (spec 16, issue #13)", async () => {
    const { container } = renderWithWorkshop(
      <ExerciseRunner
        taskId="request-dto"
        definition={TASK1_DEFINITION}
        loadAdapter={loadTask1Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "Typed Request DTO" });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});

describe("ExerciseRunner — Task 2 (request-mapper)", () => {
  it("loads the mapper exercise and reports missing-field feedback", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="request-mapper"
        definition={TASK2_DEFINITION}
        loadAdapter={loadTask2Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "Request Mapper" });
    await user.click(screen.getByRole("button", { name: /check solution/i }));

    expect(
      await screen.findByText(/userName is missing from the mapped result/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Insert solution fills the mapper, validates, and unlocks Continue", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="request-mapper"
        definition={TASK2_DEFINITION}
        loadAdapter={loadTask2Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "Request Mapper" });
    // Hints escalate inside the popover now: the trigger opens it on the
    // first hint, "Next hint" walks to the third, which unlocks the solution.
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /insert solution/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
    );
    expect(loadState().tasks["request-mapper"].draft).toBe(
      typescriptMapperAdapter.solutionEditable,
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(loadState().tasks["request-mapper"].completed).toBe(true),
    );
  });
});

describe("ExerciseRunner — Task 3 (external-api)", () => {
  it("loads the identity mapper exercise and reports missing-field feedback", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="external-api"
        definition={TASK3_DEFINITION}
        loadAdapter={loadTask3Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "External API DTO and Mapper" });
    await user.click(screen.getByRole("button", { name: /check solution/i }));

    expect(
      await screen.findByText(/userId is missing from the mapped result/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Insert solution fills the identity mapper, validates, and unlocks Continue", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="external-api"
        definition={TASK3_DEFINITION}
        loadAdapter={loadTask3Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", { name: "External API DTO and Mapper" });
    // Hints escalate inside the popover now: the trigger opens it on the
    // first hint, "Next hint" walks to the third, which unlocks the solution.
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /insert solution/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
    );
    expect(loadState().tasks["external-api"].draft).toBe(
      typescriptIdentityMapperAdapter.solutionEditable,
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(loadState().tasks["external-api"].completed).toBe(true),
    );
  });
});

describe("ExerciseRunner — Task 4 (response-dto)", () => {
  it("loads the response mapper exercise and reports missing-field feedback", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="response-dto"
        definition={TASK4_DEFINITION}
        loadAdapter={loadTask4Adapter}
        language="typescript"
      />,
    );

    await screen.findByRole("heading", {
      name: "Response DTO and Entity Mapper",
    });
    await user.click(screen.getByRole("button", { name: /check solution/i }));

    expect(
      await screen.findByText(/userName is missing from the mapped response/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue/i })).toBeDisabled();
  });

  it("Insert solution fills the response mapper, validates, unlocks Continue, and reveals the success panel", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(
      <ExerciseRunner
        taskId="response-dto"
        definition={TASK4_DEFINITION}
        loadAdapter={loadTask4Adapter}
        language="typescript"
        successPanel={<p>Live entity vs. DTO comparison</p>}
      />,
    );

    await screen.findByRole("heading", {
      name: "Response DTO and Entity Mapper",
    });
    expect(
      screen.queryByText("Live entity vs. DTO comparison"),
    ).not.toBeInTheDocument();

    // Hints escalate inside the popover now: the trigger opens it on the
    // first hint, "Next hint" walks to the third, which unlocks the solution.
    await user.click(screen.getByRole("button", { name: /show hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /next hint/i }));
    await user.click(screen.getByRole("button", { name: /insert solution/i }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled(),
    );
    expect(loadState().tasks["response-dto"].draft).toBe(
      typescriptResponseMapperAdapter.solutionEditable,
    );
    expect(
      screen.getByText("Live entity vs. DTO comparison"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() =>
      expect(loadState().tasks["response-dto"].completed).toBe(true),
    );
  });
});
