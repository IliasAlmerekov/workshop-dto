import { beforeEach, describe, expect, it } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ResetWorkshopButton } from "./ResetWorkshopButton";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";
import {
  loadState,
  saveState,
  createDefaultState,
} from "@/lib/workshop/storage";

beforeEach(() => {
  window.localStorage.clear();
});

describe("ResetWorkshopButton", () => {
  it("asks for confirmation before resetting", async () => {
    const seeded = createDefaultState();
    seeded.language = "php";
    seeded.tasks["request-dto"].completed = true;
    saveState(seeded);

    const user = userEvent.setup();
    renderWithWorkshop(<ResetWorkshopButton />);

    await user.click(screen.getByRole("button", { name: /reset workshop/i }));
    const dialog = await screen.findByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: /cancel/i }));
    expect(loadState().language).toBe("php");

    await user.click(screen.getByRole("button", { name: /reset workshop/i }));
    const dialogAgain = await screen.findByRole("dialog");
    await user.click(
      within(dialogAgain).getByRole("button", { name: /reset everything/i }),
    );

    await waitFor(() => expect(loadState().language).toBeNull());
    expect(loadState().tasks["request-dto"].completed).toBe(false);
  });

  it("closes the confirmation dialog with the Escape key without resetting", async () => {
    const seeded = createDefaultState();
    seeded.language = "python";
    saveState(seeded);

    const user = userEvent.setup();
    renderWithWorkshop(<ResetWorkshopButton />);

    await user.click(screen.getByRole("button", { name: /reset workshop/i }));
    await screen.findByRole("dialog");

    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    );
    expect(loadState().language).toBe("python");
  });
});
