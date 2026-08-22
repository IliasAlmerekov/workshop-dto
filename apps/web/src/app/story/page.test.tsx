import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import StoryPage from "./page";

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

describe("Story page", () => {
  it("distinguishes DTO, Entity, Object Mapper, and the unrelated database Data Mapper", () => {
    render(<StoryPage />);

    expect(screen.getByText("Entity")).toBeInTheDocument();
    expect(screen.getByText("DTO (Data Transfer Object)")).toBeInTheDocument();
    expect(screen.getByText("Object Mapper / Assembler")).toBeInTheDocument();
    expect(
      screen.getByText("Data Mapper (a different pattern)"),
    ).toBeInTheDocument();
    expect(screen.getByText(/persistence-layer pattern/i)).toBeInTheDocument();
  });

  it("explains the historical and the modern motivation", () => {
    render(<StoryPage />);

    expect(screen.getByText(/historically/i)).toBeInTheDocument();
    expect(screen.getByText(/remote calls/i)).toBeInTheDocument();
    expect(screen.getByText(/protects your API contract/i)).toBeInTheDocument();
  });

  it("shows the real entity and DTO responses, not invented output", async () => {
    render(<StoryPage />);

    await waitFor(() =>
      expect(screen.getByText(/"passwordHash"/)).toBeInTheDocument(),
    );
    expect(
      screen.getByText(/"displayName": "Ada Lovelace"/),
    ).toBeInTheDocument();
    expect(screen.getByText(/leaked:/i)).toHaveTextContent(
      "Leaked: passwordHash, internalNote",
    );
  });

  it("shows both the unsafe and the safe data flow diagrams", () => {
    render(<StoryPage />);

    expect(
      screen.getByRole("img", {
        name: /without a dto: user entity → serializer → client/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", {
        name: /with a dto and mapper: user entity → userresponsemapper → userresponse dto → serializer → client/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/unintentionally coupled/i)).toBeInTheDocument();
  });

  it("covers all four boundary use cases tied to the four exercises", () => {
    render(<StoryPage />);

    expect(screen.getByText("HTTP request → application")).toBeInTheDocument();
    expect(screen.getByText("Normalizing that input")).toBeInTheDocument();
    expect(
      screen.getByText("External API → your application"),
    ).toBeInTheDocument();
    expect(screen.getByText("Application → HTTP response")).toBeInTheDocument();
  });

  it("presents benefits, drawbacks, and a decision rule without claiming DTOs are always required", () => {
    render(<StoryPage />);

    expect(screen.getByText("Benefits")).toBeInTheDocument();
    expect(screen.getByText("Drawbacks")).toBeInTheDocument();
    expect(
      screen.getByText(/does not teach.*always use a dto/i),
    ).toBeInTheDocument();
  });

  it("links back to the landing page and to the standalone comparison", () => {
    render(<StoryPage />);

    expect(
      screen.getByRole("link", { name: /start the exercises/i }),
    ).toHaveAttribute("href", "/");
    expect(
      screen.getByRole("link", {
        name: /open the entity vs\. dto comparison/i,
      }),
    ).toHaveAttribute("href", "/demo");
  });
});
