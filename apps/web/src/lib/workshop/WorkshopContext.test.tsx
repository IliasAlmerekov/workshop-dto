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
      <span data-testid="hints-used">
        {workshop.activeTaskId
          ? workshop.state.tasks[workshop.activeTaskId].hintsUsed
          : "none"}
      </span>
      <span data-testid="quiz-completed">
        {String(workshop.state.quizCompleted)}
      </span>
      <button onClick={() => workshop.selectLanguage("php")}>select-php</button>
      <button onClick={() => workshop.completeQuiz()}>complete-quiz</button>
      <button onClick={() => workshop.updateDraft("request-dto", "draft text")}>
        set-draft
      </button>
      <button onClick={() => workshop.recordHintUsed("request-dto")}>
        use-hint
      </button>
      <button onClick={() => workshop.completeTask("request-dto")}>
        complete-request-dto
      </button>
      <button onClick={() => workshop.selectTask("request-dto")}>
        select-request-dto
      </button>
      <button onClick={() => workshop.selectTask("request-mapper")}>
        select-request-mapper
      </button>
      <button onClick={() => workshop.selectTask("welcome-email-dto")}>
        select-email-dto
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

  it("selectTask lets the participant return to an already completed task without clearing its results", async () => {
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

    await user.click(screen.getByText("select-request-dto"));
    await waitFor(() =>
      expect(screen.getByTestId("active-task")).toHaveTextContent(
        "request-dto",
      ),
    );
    expect(loadState().tasks["request-dto"].completed).toBe(true);
  });

  it("selectTask refuses a task that is not yet open (spec 16.1: nothing skipped)", async () => {
    const user = userEvent.setup();
    render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("active-task")).toHaveTextContent(
        "request-dto",
      ),
    );

    await user.click(screen.getByText("select-request-mapper"));
    await user.click(screen.getByText("select-email-dto"));
    expect(screen.getByTestId("active-task")).toHaveTextContent("request-dto");
  });

  it("completing a task from a revisited selection advances to the next open task", async () => {
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
    await user.click(screen.getByText("select-request-dto"));
    await waitFor(() =>
      expect(screen.getByTestId("active-task")).toHaveTextContent(
        "request-dto",
      ),
    );

    await user.click(screen.getByText("complete-request-dto"));
    await waitFor(() =>
      expect(screen.getByTestId("active-task")).toHaveTextContent(
        "request-mapper",
      ),
    );
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

  it("a fresh provider mount (simulating reload) restores language, draft, and hints used (spec 10/16.6)", async () => {
    const user = userEvent.setup();
    const { unmount } = render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() => screen.getByTestId("active-task"));
    await user.click(screen.getByText("select-php"));
    await user.click(screen.getByText("set-draft"));
    await user.click(screen.getByText("use-hint"));
    await user.click(screen.getByText("use-hint"));
    await waitFor(() =>
      expect(screen.getByTestId("hints-used")).toHaveTextContent("2"),
    );

    // A real reload tears down all in-memory state — a fresh provider
    // mount reading only from localStorage is the faithful simulation.
    unmount();
    render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("language")).toHaveTextContent("php"),
    );
    expect(screen.getByTestId("active-task")).toHaveTextContent("request-dto");
    expect(screen.getByTestId("hints-used")).toHaveTextContent("2");
    expect(loadState().tasks["request-dto"].draft).toBe("draft text");
  });

  it("recordHintUsed clamps at 4 stages even if called more times than the UI intends (spec 7.3)", async () => {
    const user = userEvent.setup();
    render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() => screen.getByTestId("active-task"));
    for (let i = 0; i < 6; i += 1) {
      await user.click(screen.getByText("use-hint"));
    }

    await waitFor(() =>
      expect(screen.getByTestId("hints-used")).toHaveTextContent("4"),
    );
    expect(loadState().tasks["request-dto"].hintsUsed).toBe(4);
  });

  it("completeQuiz persists the knowledge check's completion (spec 7.5/10)", async () => {
    const user = userEvent.setup();
    render(
      <WorkshopProvider>
        <Probe />
      </WorkshopProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId("quiz-completed")).toHaveTextContent("false"),
    );

    await user.click(screen.getByText("complete-quiz"));

    await waitFor(() =>
      expect(screen.getByTestId("quiz-completed")).toHaveTextContent("true"),
    );
    expect(loadState().quizCompleted).toBe(true);
  });

  it("resetWorkshop clears all state including completed tasks and the quiz", async () => {
    const seeded = createDefaultState();
    seeded.language = "java";
    seeded.tasks["request-dto"].completed = true;
    seeded.quizCompleted = true;
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
    expect(screen.getByTestId("quiz-completed")).toHaveTextContent("true");

    await user.click(screen.getByText("reset"));

    await waitFor(() =>
      expect(screen.getByTestId("language")).toHaveTextContent("none"),
    );
    expect(loadState().tasks["request-dto"].completed).toBe(false);
    expect(loadState().quizCompleted).toBe(false);
  });
});
