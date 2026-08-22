import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguagePicker } from "./LanguagePicker";

describe("LanguagePicker", () => {
  it("exposes a radio group with the four supported languages", () => {
    render(<LanguagePicker value={null} onChange={vi.fn()} />);

    const group = screen.getByRole("radiogroup", {
      name: /choose your programming language/i,
    });
    expect(within(group).getAllByRole("radio")).toHaveLength(4);
    for (const label of ["PHP", "TypeScript", "Python", "Java"]) {
      expect(
        within(group).getByRole("radio", { name: label }),
      ).toBeInTheDocument();
    }
  });

  it("marks the selected language as checked", () => {
    render(<LanguagePicker value="java" onChange={vi.fn()} />);

    expect(screen.getByRole("radio", { name: "Java" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: "PHP" })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("is operable via keyboard: Tab focuses an option, Enter selects it", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LanguagePicker value={null} onChange={onChange} />);

    await user.tab();
    expect(screen.getByRole("radio", { name: "PHP" })).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onChange).toHaveBeenCalledWith("php");
  });
});
