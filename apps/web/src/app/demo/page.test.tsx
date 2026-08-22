import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { axe } from "jest-axe";
import DemoPage from "./page";

vi.mock("@/lib/config", () => ({ API_BASE_URL: "http://localhost:8000" }));

const ENTITY_PAYLOAD = {
  id: 7,
  userName: "ada.lovelace",
  firstName: "Ada",
  lastName: "Lovelace",
  birthDate: "1815-12-10T00:00:00+00:00",
  email: "ada@example.test",
  passwordHash: "$argon2id$fake",
  internalNote: "VIP migration candidate",
  createdAt: "2024-01-01T00:00:00+00:00",
};

const DTO_PAYLOAD = {
  id: 7,
  userName: "ada.lovelace",
  displayName: "Ada Lovelace",
  birthDate: "1815-12-10",
  email: "ada@example.test",
};

function mockFetchByUrl(handlers: Record<string, () => Promise<Response>>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((input: string | URL) => {
      const url = String(input);
      const match = Object.entries(handlers).find(([suffix]) =>
        url.endsWith(suffix),
      );
      if (!match) {
        throw new Error(`Unexpected fetch: ${url}`);
      }
      return match[1]();
    }),
  );
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    text: async () => JSON.stringify(body),
  } as Response);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  mockFetchByUrl({
    "/api/demo/users/7/entity": () => jsonResponse(ENTITY_PAYLOAD),
    "/api/demo/users/7/dto": () => jsonResponse(DTO_PAYLOAD),
  });
});

describe("Demo page", () => {
  it("shows the raw JSON from both endpoints without hiding it", async () => {
    render(<DemoPage />);

    await waitFor(() =>
      expect(screen.getByText(/"passwordHash"/)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/"displayName": "Ada Lovelace"/),
    ).toBeInTheDocument();
    // The raw entity JSON is shown as-is, not summarized away.
    expect(screen.getByText(/"internalNote"/)).toBeInTheDocument();
  });

  it("flags the leaked fields on the entity panel", async () => {
    render(<DemoPage />);

    await waitFor(() =>
      expect(screen.getByText(/leaked:/i)).toHaveTextContent(
        "Leaked: passwordHash, internalNote",
      ),
    );
  });

  it("shows a waking-up state while auto-retrying an unreachable API", async () => {
    mockFetchByUrl({
      "/api/demo/users/7/entity": () =>
        Promise.reject(new Error("network down")),
      "/api/demo/users/7/dto": () => jsonResponse(DTO_PAYLOAD),
    });

    render(<DemoPage />);

    await waitFor(() =>
      expect(screen.getByText(/waking up the demo api/i)).toBeInTheDocument(),
    );
    // The other, healthy panel is unaffected by the entity panel's retries.
    expect(
      screen.getByText(/"displayName": "Ada Lovelace"/),
    ).toBeInTheDocument();
  });

  // The full cycle — auto-retry through backoff, final error after
  // MAX_AUTO_RETRIES, manual retry, recovery — is covered in isolation and
  // reliably by src/lib/useJsonEndpoint.test.ts (using vi.waitFor, which is
  // fake-timer-aware). Reproducing it here through the whole page with
  // userEvent + fake timers is a known-fragile combination in jsdom and
  // would only duplicate that coverage, so this file sticks to the
  // page-level wiring (leak flagging, "waking" state) instead.

  it("has no automatically detectable accessibility violations (spec 16, issue #13)", async () => {
    const { container } = render(<DemoPage />);
    await waitFor(() =>
      expect(screen.getByText(/"passwordHash"/)).toBeInTheDocument(),
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
