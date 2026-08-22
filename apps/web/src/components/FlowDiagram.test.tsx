import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlowDiagram } from "./FlowDiagram";

describe("FlowDiagram", () => {
  it("gives every whole-diagram meaning as a single readable aria-label", () => {
    render(
      <FlowDiagram
        title="Without a DTO"
        steps={[
          { label: "User entity", tone: "warning" },
          { label: "Serializer" },
          { label: "Client" },
        ]}
      />,
    );

    expect(
      screen.getByRole("img", {
        name: "Without a DTO: User entity → Serializer → Client",
      }),
    ).toBeInTheDocument();
  });

  it("marks a warning-toned step with a glyph, not color alone (DESIGN.md state rule)", () => {
    render(
      <FlowDiagram
        title="Without a DTO"
        steps={[{ label: "User entity", tone: "warning" }, { label: "Client" }]}
      />,
    );

    // The glyph is part of the box's own text, independent of any color styling.
    expect(screen.getByText("⚠")).toBeInTheDocument();
  });

  it("marks a safe-toned step with a different glyph than a warning-toned one", () => {
    render(
      <FlowDiagram
        title="With a DTO"
        steps={[
          { label: "UserResponseMapper", tone: "safe" },
          { label: "Client" },
        ]}
      />,
    );

    expect(screen.getByText("✓")).toBeInTheDocument();
    expect(screen.queryByText("⚠")).not.toBeInTheDocument();
  });

  it("leaves a default-toned step without any glyph", () => {
    render(
      <FlowDiagram title="With a DTO" steps={[{ label: "Serializer" }]} />,
    );

    expect(screen.queryByText("⚠")).not.toBeInTheDocument();
    expect(screen.queryByText("✓")).not.toBeInTheDocument();
    expect(screen.getByText("Serializer")).toBeInTheDocument();
  });
});
