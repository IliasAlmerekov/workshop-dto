import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Stepper } from "./Stepper";
import { createDefaultState } from "@/lib/workshop/storage";

describe("Stepper", () => {
  it("shows a lock indicator next to every task except the active one", () => {
    const state = createDefaultState();
    render(<Stepper tasks={state.tasks} activeTaskId="request-dto" />);

    expect(screen.getAllByLabelText("locked")).toHaveLength(3);
    for (const label of [
      "Request DTO",
      "Request Mapper",
      "External API",
      "Response DTO",
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
});
