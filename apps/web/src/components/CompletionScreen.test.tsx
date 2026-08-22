import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor } from "@testing-library/react";
import { CompletionScreen } from "./CompletionScreen";
import { renderWithWorkshop } from "@/test-utils/renderWithWorkshop";

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

function jsonResponse(body: unknown) {
  return Promise.resolve({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
  } as Response);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

beforeEach(() => {
  window.localStorage.clear();
  mockFetchByUrl({
    "/api/demo/users/7/entity": () => jsonResponse(ENTITY_PAYLOAD),
    "/api/demo/users/7/dto": () => jsonResponse(DTO_PAYLOAD),
  });
});

describe("CompletionScreen", () => {
  it("compares the real entity and DTO JSON and shows the safe data flow", async () => {
    renderWithWorkshop(<CompletionScreen />);

    await waitFor(() =>
      expect(screen.getByText(/"passwordHash"/)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/"displayName": "Ada Lovelace"/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /the safe data flow you just built/i,
      }),
    ).toBeInTheDocument();
  });

  it("connects all four exercises to their boundary use cases", () => {
    renderWithWorkshop(<CompletionScreen />);

    expect(screen.getByText(/HTTP request → application/)).toBeInTheDocument();
    expect(screen.getByText(/Normalizing that input/)).toBeInTheDocument();
    expect(
      screen.getByText(/External API → your application/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Application → HTTP response/)).toBeInTheDocument();
  });

  it("offers the knowledge check", () => {
    renderWithWorkshop(<CompletionScreen />);

    expect(screen.getByText(/quick knowledge check/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /why is it risky to serialize the internal user entity/i,
      ),
    ).toBeInTheDocument();
  });

  it("links to the repository and the real model-solution files", () => {
    renderWithWorkshop(<CompletionScreen />);

    expect(
      screen.getByRole("link", { name: /view the repository/i }),
    ).toHaveAttribute("href", "https://github.com/IliasAlmerekov/workshop-dto");
    expect(
      screen.getByRole("link", { name: /UserResponseMapper/ }),
    ).toHaveAttribute(
      "href",
      "https://github.com/IliasAlmerekov/workshop-dto/blob/main/apps/api/src/Mapper/UserResponseMapper.php",
    );
  });
});
