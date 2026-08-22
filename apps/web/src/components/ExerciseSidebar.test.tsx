import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExerciseSidebar } from "./ExerciseSidebar";
import { taskDefinition } from "@/lib/workshop/tasks";

/**
 * Regression coverage for a real bug found while wiring up the Data Transit
 * Lab pipeline (issue #12): the sidebar's pipeline visualization was
 * hardcoded to always highlight "Request DTO", regardless of which task was
 * actually active — so tasks 2-4 all showed the wrong stage highlighted.
 */
describe("ExerciseSidebar", () => {
  it.each([
    ["request-dto", "Request DTO"],
    ["request-mapper", "Mapper"],
    ["external-api", "Entity"],
    ["response-dto", "Response DTO"],
  ] as const)(
    "highlights the %s task's pipeline stage (%s), not always Request DTO",
    (taskId, expectedLayer) => {
      render(
        <ExerciseSidebar task={taskDefinition(taskId)} nextTitle={null} />,
      );

      // jsdom has no WebGL, so this renders the static 2D fallback — its
      // highlighted layer's label carries the accent color, the rest don't.
      const highlighted = screen.getByText(expectedLayer);
      expect(highlighted).toHaveAttribute("fill", "var(--accent)");
    },
  );

  it("shows What's next text pointing at the following exercise", () => {
    render(
      <ExerciseSidebar
        task={taskDefinition("request-dto")}
        nextTitle="Request Mapper"
      />,
    );

    expect(
      screen.getByText(/you'll continue with "request mapper"/i),
    ).toBeInTheDocument();
  });
});
