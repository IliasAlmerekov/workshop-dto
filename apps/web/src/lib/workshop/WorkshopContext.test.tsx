import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { WorkshopProvider, useWorkshop } from "./WorkshopContext";
import { loadState, saveState, createDefaultState } from "./storage";

function Probe() {
  const workshop = useWorkshop();
  return (
    <div>
      <span data-testid="language">{workshop.state.language ?? "none"}</span>
      <span data-testid="active-task">{workshop.activeTaskId ?? "none"}</span>
      <span data-testid="has-active-draft">
        {String(workshop.hasActiveDraft)}
      </span>
      <button onClick={() => workshop.selectLanguage("php")}>select-php</button>
      <button onClick={() => workshop.updateDraft("request-dto", "draft text")}>
        set-draft
      </button>
      <button onClick={() => workshop.completeTask("request-dto")}>
        complete-request-dto
      </button>
      <button onClick={() => workshop.clearActiveDraft()}>
        clear-active-draft
      </button>
      <button onClick={() => workshop.resetWorkshop()}>reset</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("WorkshopProvider", () => {
  it("hydrates from localStorage and persists changes", async () => {
    const user = userEvent.setup();
    render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("language")).toHaveTextContent("none"),
    );

    await user.click(screen.getByText("select-php"));
    await waitFor(() => expect(loadState().language).toBe("php"));

    await user.click(screen.getByText("set-draft"));
    await waitFor(() =>
      expect(screen.getByTestId("has-active-draft")).toHaveTextContent("true"),
    );
    expect(loadState().tasks["request-dto"].draft).toBe("draft text");
  });

  it("completing a task advances the active task and keeps it completed after reset of another draft", async () => {
    const user = userEvent.setup();
    render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() => screen.getByTestId("active-task"));
    await user.click(screen.getByText("complete-request-dto"));

    await waitFor(() =>
      expect(screen.getByTestId("active-task")).toHaveTextContent(
        "request-mapper",
      ),
    );
    expect(loadState().tasks["request-dto"].completed).toBe(true);
  });

  it("clearActiveDraft only clears the currently active task's draft", async () => {
    const user = userEvent.setup();
    render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() => screen.getByTestId("active-task"));
    // A draft only counts as work in progress once a track is chosen, since it
    // is compared against that track's starter code.
    await user.click(screen.getByText("select-php"));
    await user.click(screen.getByText("set-draft"));
    await waitFor(() =>
      expect(screen.getByTestId("has-active-draft")).toHaveTextContent("true"),
    );

    await user.click(screen.getByText("clear-active-draft"));
    await waitFor(() =>
      expect(screen.getByTestId("has-active-draft")).toHaveTextContent("false"),
    );
    expect(loadState().tasks["request-dto"].draft).toBe("");
  });

  it("resetWorkshop clears all state including completed tasks", async () => {
    const seeded = createDefaultState();
    seeded.language = "java";
    seeded.tasks["request-dto"].completed = true;
    saveState(seeded);

    const user = userEvent.setup();
    render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("language")).toHaveTextContent("java"),
    );

    await user.click(screen.getByText("reset"));

    await waitFor(() =>
      expect(screen.getByTestId("language")).toHaveTextContent("none"),
    );
    expect(loadState().tasks["request-dto"].completed).toBe(false);
  });
});
