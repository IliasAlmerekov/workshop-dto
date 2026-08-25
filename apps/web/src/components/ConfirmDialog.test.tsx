import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ConfirmDialog } from "./ConfirmDialog";

function setup(overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Reset the whole workshop?"
      description="This cannot be undone."
      confirmLabel="Reset everything"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
  return { onConfirm, onCancel };
}

describe("ConfirmDialog keyboard operation", () => {
  // Opening lands focus on the way out, not on the destructive action: a
  // stray Enter right after opening must not wipe the participant's progress.
  it("opens with focus on the safe action", async () => {
    setup();

    const dialog = await screen.findByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();
  });

  it("cancels with Enter straight from the opened state", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();

    await user.keyboard("{Enter}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("reaches the destructive action by Tab and confirms with Enter", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();

    await user.tab();
    expect(
      screen.getByRole("button", { name: /reset everything/i }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("is not rendered as an open dialog while closed", () => {
    setup({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
