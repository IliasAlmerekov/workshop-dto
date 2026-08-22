import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { KnowledgeCheck } from "./KnowledgeCheck";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import { loadState } from "@/lib/workshop/storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("KnowledgeCheck", () => {
  it("shows explanatory feedback for both a correct and an incorrect answer", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<KnowledgeCheck />);

    await user.click(
      screen.getByRole("button", {
        name: "It's slower than mapping to a DTO.",
      }),
    );
    expect(
      screen.getByText(/performance isn't the core issue/i),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: /couples the public API contract to internal fields/i,
      }),
    );
    expect(
      screen.getByText(/leaks passwordHash and internalNote/i),
    ).toBeInTheDocument();
  });

  it("does not mark the quiz complete until all three questions are answered", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<KnowledgeCheck />);

    await user.click(
      screen.getByRole("button", {
        name: /couples the public API contract to internal fields/i,
      }),
    );
    expect(loadState().quizCompleted).toBe(false);

    await user.click(
      screen.getByRole("button", {
        name: /explicit translation between two data shapes/i,
      }),
    );
    expect(loadState().quizCompleted).toBe(false);

    await user.click(
      screen.getByRole("button", {
        name: /single-process code where the producer and consumer already share full trust/i,
      }),
    );
    await waitFor(() => expect(loadState().quizCompleted).toBe(true));
  });

  it("lets a participant change their answer without breaking completion tracking", async () => {
    const user = userEvent.setup();
    renderWithWorkshop(<KnowledgeCheck />);

    const questions = [
      /couples the public API contract to internal fields/i,
      /explicit translation between two data shapes/i,
      /single-process code where the producer and consumer already share full trust/i,
    ];
    for (const name of questions) {
      await user.click(screen.getByRole("button", { name }));
    }
    await waitFor(() => expect(loadState().quizCompleted).toBe(true));

    // Revisiting an already-answered question must not error or reset completion.
    await user.click(
      screen.getByRole("button", {
        name: "It's slower than mapping to a DTO.",
      }),
    );
    expect(loadState().quizCompleted).toBe(true);
  });

  it("has no automatically detectable accessibility violations (spec 16, issue #13)", async () => {
    const { container } = renderWithWorkshop(<KnowledgeCheck />);
    await screen.findByRole("button", {
      name: /couples the public API contract to internal fields/i,
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
