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
  it("moves focus into the dialog when it opens", async () => {
    setup();

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it("reaches both actions by Tab and confirms with Enter", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();

    await user.tab();
    expect(screen.getByRole("button", { name: /cancel/i })).toHaveFocus();

    await user.tab();
    expect(
      screen.getByRole("button", { name: /reset everything/i }),
    ).toHaveFocus();

    await user.keyboard("{Enter}");
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("cancels with Enter on the cancel action", async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();

    await user.tab();
    await user.keyboard("{Enter}");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("is not rendered as an open dialog while closed", () => {
    setup({ open: false });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
