import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import type { HintCard } from "@/lib/exercises/types";
import { HintPopover } from "./HintPopover";

const hints: HintCard[] = [
  { kind: "concept", text: "Start with the transport boundary." },
  { kind: "fields", text: "Map only the declared fields." },
  {
    kind: "syntax",
    text: "Use the track-specific constructor syntax.",
    code: "new RequestDto(userName)",
  },
];

describe("HintPopover", () => {
  it("lets participants return from the third hint to every unlocked hint", async () => {
    const user = userEvent.setup();

    render(
      <HintPopover
        hints={hints}
        shown={3}
        onReveal={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(screen.getByText("Hint 3 of 3")).toBeInTheDocument();
    expect(screen.getByText(hints[2].text)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Next unlocked hint" }),
    ).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Previous hint" }));
    expect(screen.getByText("Hint 2 of 3")).toBeInTheDocument();
    expect(screen.getByText(hints[1].text)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous hint" }));
    expect(screen.getByText("Hint 1 of 3")).toBeInTheDocument();
    expect(screen.getByText(hints[0].text)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Previous hint" }),
    ).toBeDisabled();

    await user.click(
      screen.getByRole("button", { name: "Next unlocked hint" }),
    );
    expect(screen.getByText("Hint 2 of 3")).toBeInTheDocument();
  });

  it("has no automatically detectable accessibility violations", async () => {
    const { baseElement } = render(
      <HintPopover
        hints={hints}
        shown={3}
        onReveal={vi.fn()}
        open
        onOpenChange={vi.fn()}
      />,
    );

    expect(await axe(baseElement)).toHaveNoViolations();
  });
});
