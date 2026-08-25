import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { WorkshopHeader } from "./WorkshopHeader";
import { LocaleProvider } from "@/lib/i18n";
import { LOCALE_STORAGE_KEY } from "@/lib/i18n/locale";
import { WorkshopProvider } from "@/lib/workshop/WorkshopContext";

beforeEach(() => {
  window.localStorage.clear();
});

describe("LocaleSwitcher", () => {
  it("offers both languages by their own name and marks the active one", () => {
    render(
      <LocaleProvider>
        <LocaleSwitcher />
      </LocaleProvider>,
    );

    expect(screen.getByRole("button", { name: /English/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Deutsch/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("translates the interface and persists the choice", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <WorkshopProvider>
          <WorkshopHeader />
        </WorkshopProvider>
      </LocaleProvider>,
    );

    expect(
      screen.getByRole("button", { name: "Reset workshop" }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Deutsch/ }));

    expect(
      screen.getByRole("button", { name: "Workshop zurücksetzen" }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("de");
    expect(document.documentElement.lang).toBe("de");
  });

  it("no longer renders the account avatar in the header", () => {
    render(
      <LocaleProvider>
        <WorkshopProvider>
          <WorkshopHeader />
        </WorkshopProvider>
      </LocaleProvider>,
    );

    expect(screen.queryByText("JD")).not.toBeInTheDocument();
  });
});
