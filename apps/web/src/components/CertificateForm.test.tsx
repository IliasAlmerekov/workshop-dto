import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CertificateForm } from "./CertificateForm";

const downloadCertificate = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/certificate/generateCertificate", () => ({
  downloadCertificate: (...args: unknown[]) => downloadCertificate(...args),
}));

describe("CertificateForm", () => {
  it("disables the download button until a name is entered", async () => {
    const user = userEvent.setup();
    render(<CertificateForm />);

    const button = screen.getByRole("button", {
      name: /download certificate/i,
    });
    expect(button).toBeDisabled();

    await user.type(screen.getByRole("textbox", { name: /your name/i }), "Ada");
    expect(button).toBeEnabled();

    await user.clear(screen.getByRole("textbox", { name: /your name/i }));
    expect(button).toBeDisabled();
  });

  it("generates the certificate with the trimmed name and does not persist it anywhere", async () => {
    const user = userEvent.setup();
    const keysBefore = Object.keys(window.localStorage);
    render(<CertificateForm />);

    await user.type(
      screen.getByRole("textbox", { name: /your name/i }),
      "  Ada Lovelace  ",
    );
    await user.click(
      screen.getByRole("button", { name: /download certificate/i }),
    );

    await waitFor(() => expect(downloadCertificate).toHaveBeenCalledTimes(1));
    const call = downloadCertificate.mock.calls[0][0];
    expect(call.name).toBe("Ada Lovelace");
    expect(call.completedAt).toBeInstanceOf(Date);
    // The name never touches localStorage — unlike the rest of the
    // workshop's progress, it's held only in this component's own state.
    expect(Object.keys(window.localStorage)).toEqual(keysBefore);
  });

  it("does not submit while a name is only whitespace", async () => {
    const user = userEvent.setup();
    render(<CertificateForm />);

    await user.type(screen.getByRole("textbox", { name: /your name/i }), "   ");
    expect(
      screen.getByRole("button", { name: /download certificate/i }),
    ).toBeDisabled();
  });
});
