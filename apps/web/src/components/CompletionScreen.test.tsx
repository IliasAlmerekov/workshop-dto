import { afterEach, describe, expect, it } from "vitest";
import { cleanup, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { CompletionScreen } from "./CompletionScreen";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";

afterEach(() => {
  cleanup();
});

describe("CompletionScreen", () => {
  it("offers the certificate download once the workshop is complete", () => {
    renderWithWorkshop(<CompletionScreen />);

    expect(
      screen.getByRole("textbox", { name: /your name/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /download certificate/i }),
    ).toBeInTheDocument();
  });

  it("shows the deterministic safe response and prepared email alongside completion", () => {
    renderWithWorkshop(<CompletionScreen />);

    expect(screen.getByTestId("completion-balloons")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.getByText(/quick knowledge check/i)).toBeInTheDocument();
    expect(screen.getByText(/safe RegistrationResponse/i)).toBeInTheDocument();
    expect(screen.getByText(/prepared WelcomeEmail/i)).toBeInTheDocument();
    expect(screen.getByText(/no account was created/i)).toBeInTheDocument();
  });

  it("has no automatically detectable accessibility violations (spec 16, issue #13)", async () => {
    const { container } = renderWithWorkshop(<CompletionScreen />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
