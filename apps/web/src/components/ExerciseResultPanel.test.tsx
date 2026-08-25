import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { ExerciseResultPanel } from "./ExerciseResultPanel";
import { taskDefinition } from "@/lib/workshop/tasks";
import {
  ExerciseResultProvider,
  usePublishExerciseResult,
} from "@/lib/workshop/ExerciseResultContext";
import type { ValidationResult } from "@/lib/exercises/types";
import type { TaskId } from "@/lib/workshop/types";

function Publisher({
  taskId,
  result,
}: {
  taskId: TaskId;
  result: ValidationResult;
}) {
  const publish = usePublishExerciseResult();
  useEffect(() => publish({ taskId, result }), [publish, taskId, result]);
  return null;
}

function renderWithResult(taskId: TaskId, result: ValidationResult) {
  return render(
    <ExerciseResultProvider>
      <Publisher taskId={taskId} result={result} />
      <ExerciseResultPanel task={taskDefinition(taskId)} />
    </ExerciseResultProvider>,
  );
}

const passing: ValidationResult = {
  passed: true,
  checks: [{ id: "a", passed: true, message: "userName is declared" }],
};

const failing: ValidationResult = {
  passed: false,
  checks: [
    { id: "a", passed: true, message: "userName is declared" },
    { id: "b", passed: false, message: "birthDate is still text, not a date" },
  ],
};

describe("ExerciseResultPanel", () => {
  // The report is a stack of themed cards on the recessed page background,
  // and the whole stack is one polite live region so a verdict is announced
  // once rather than card by card.
  it("reports as one live region of themed cards", () => {
    render(<ExerciseResultPanel task={taskDefinition("request-mapper")} />);

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");

    const cards = status.querySelectorAll("section");
    expect(cards.length).toBeGreaterThan(0);
    cards.forEach((card) => {
      expect(card).toHaveClass(
        "rounded-xl",
        "border-[var(--border)]",
        "bg-[var(--surface)]",
      );
    });

    expect(status.closest("aside")).toHaveClass("workshop-gutter-end");
  });

  it("waits for a check before it says anything", () => {
    render(<ExerciseResultPanel task={taskDefinition("request-mapper")} />);

    expect(screen.queryByText('"ada.lovelace"')).not.toBeInTheDocument();
    expect(
      screen.getByText(/run Check solution to see the result here/i),
    ).toBeInTheDocument();
  });

  it("reports a failure with the broken rule and no result", () => {
    renderWithResult("request-mapper", failing);

    expect(screen.getByText("Validation failed")).toBeInTheDocument();
    expect(screen.getByText("1 / 2 checks passed")).toBeInTheDocument();
    // Every row states its verdict in words, not colour alone.
    expect(screen.getByText("Failed")).toBeInTheDocument();
    expect(screen.getByText("Passed")).toBeInTheDocument();
    expect(screen.getByText("userName is declared")).toBeInTheDocument();
    // The broken rule reads once by default: the guidance that repeats it is
    // a drill-down, closed until asked for.
    expect(
      screen.getByText("birthDate is still text, not a date"),
    ).toBeInTheDocument();
    expect(screen.queryByText("What to fix")).toBeNull();
    expect(screen.queryByText('"ada.lovelace"')).not.toBeInTheDocument();
  });

  // No compiler runs in this app (participant code is never executed), so the
  // failing report must never claim to show compiler or type-error output.
  it("guides without inventing compiler output", async () => {
    const user = userEvent.setup();
    const { container } = renderWithResult("request-mapper", failing);

    await user.click(
      screen.getByRole("button", { name: /details & guidance/i }),
    );

    expect(screen.getByText("What to fix")).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/compiler|type error/i);
  });

  it("reports success and prints the produced values", () => {
    renderWithResult("request-mapper", passing);

    expect(screen.getByText("All checks passed")).toBeInTheDocument();
    expect(screen.getByText("1 / 1 checks passed")).toBeInTheDocument();
    expect(screen.getByText('"ada.lovelace"')).toBeInTheDocument();
    expect(screen.getByText('"ada@example.test"')).toBeInTheDocument();
  });

  it("points a passing task at the next one without a second CTA", () => {
    renderWithResult("request-dto", passing);

    expect(
      screen.getByText("You can continue to Request Mapper"),
    ).toBeInTheDocument();
    // Continue lives under the editor; this column only reports readiness.
    expect(screen.queryByRole("button", { name: /continue/i })).toBeNull();
  });

  it("ignores a result published for a different task", () => {
    render(
      <ExerciseResultProvider>
        <Publisher taskId="request-dto" result={passing} />
        <ExerciseResultPanel task={taskDefinition("welcome-email-dto")} />
      </ExerciseResultProvider>,
    );

    // Task 3's own verdict is still unrun, so its output stays redacted even
    // though a sibling task published a passing one.
    expect(
      screen.getByText(/run Check solution to see the result here/i),
    ).toBeInTheDocument();
    expect(screen.queryByText("true")).not.toBeInTheDocument();
  });

  it("never prints the entity fields the response must not carry", () => {
    const { container } = renderWithResult(
      "registration-response-mapper",
      passing,
    );

    expect(screen.getByText('"Ada Lovelace"')).toBeInTheDocument();
    expect(container.textContent).not.toContain("passwordHash");
    expect(container.textContent).not.toContain("internalNote");
  });
});
