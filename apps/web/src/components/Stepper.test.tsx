import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Stepper } from "./Stepper";
import { createDefaultState } from "@/lib/workshop/storage";

describe("Stepper", () => {
  it("shows a lock indicator next to every task except the active one", () => {
    const state = createDefaultState();
    render(<Stepper tasks={state.tasks} activeTaskId="request-dto" />);

    expect(screen.getAllByLabelText("locked")).toHaveLength(5);
    for (const label of [
      "Request DTO",
      "Request Mapper",
      "Email DTO",
      "Email Mapper",
      "Response DTO",
      "Response Mapper",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it("marks the active step with aria-current", () => {
    const state = createDefaultState();
    render(<Stepper tasks={state.tasks} activeTaskId="request-mapper" />);

    const current = screen.getByText("02").closest('[aria-current="step"]');
    expect(current).toBeInTheDocument();
  });

  it("shows a checkmark instead of a number for completed tasks", () => {
    const state = createDefaultState();
    state.tasks["request-dto"].completed = true;
    render(<Stepper tasks={state.tasks} activeTaskId="request-mapper" />);

    expect(screen.queryByText("01")).not.toBeInTheDocument();
  });

  it("lets the participant revisit a completed step, without making locked steps clickable (spec 16.1)", async () => {
    const user = userEvent.setup();
    const onSelectTask = vi.fn();
    const state = createDefaultState();
    state.tasks["request-dto"].completed = true;
    render(
      <Stepper
        tasks={state.tasks}
        activeTaskId="request-mapper"
        onSelectTask={onSelectTask}
      />,
    );

    // The completed task is a button that returns to it; locked and active
    // steps stay inert, so nothing can be jumped ahead to.
    const revisit = screen.getByRole("button", { name: "Request DTO" });
    expect(revisit).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Request Mapper" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Email DTO" })).toBeNull();

    await user.click(revisit);
    expect(onSelectTask).toHaveBeenCalledWith("request-dto");
  });

  it("renders every step as inert display when no onSelectTask handler is given", () => {
    const state = createDefaultState();
    state.tasks["request-dto"].completed = true;
    render(<Stepper tasks={state.tasks} activeTaskId="request-mapper" />);

    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
  });
});
