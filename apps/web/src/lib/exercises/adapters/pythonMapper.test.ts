import { describe, expect, it } from "vitest";
import { pythonMapperAdapter } from "./pythonMapper";

describe("pythonMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = pythonMapperAdapter.validate(
      pythonMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (birth_date left as text) without leaking the fix", () => {
    const doc = `from datetime import date


class CreateUserRequestMapper:
    def map(self, raw: dict) -> CreateUserRequest:
        return CreateUserRequest(
            userName=raw["user_name"].strip().lower(),
            firstName=raw["first_name"].strip(),
            lastName=raw["last_name"].strip(),
            birthDate=raw["birth_date"].strip(),
            email=raw["email"].strip().lower(),
        )
`;
    const result = pythonMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const dateCheck = result.checks.find(
      (c) => c.id === "field-birthDate-date",
    );
    expect(dateCheck?.passed).toBe(false);
    expect(dateCheck?.message).not.toMatch(/fromisoformat/);
    expect(
      result.checks.filter((c) => c.id !== "field-birthDate-date" && !c.passed),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution using single-quoted keys", () => {
    const doc = `from datetime import date


class CreateUserRequestMapper:
    def map(self, raw: dict) -> CreateUserRequest:
        return CreateUserRequest(
            userName=raw['user_name'].strip().lower(),
            firstName=raw['first_name'].strip(),
            lastName=raw['last_name'].strip(),
            birthDate=date.fromisoformat(raw['birth_date'].strip()),
            email=raw['email'].strip().lower(),
        )
`;
    const result = pythonMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `from datetime import date


class CreateUserRequestMapper:
    def map(self, raw: dict) -> CreateUserRequest:
        return CreateUserRequest(
            userName=raw["user_name"].strip().lower(),
            firstName=raw["first_name"].strip(),
            lastName=raw["last_name"].strip(),
            birthDate=date.fromisoformat(raw["birth_date"].strip()),
        )
`;
    const result = pythonMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
      message: expect.stringContaining("email"),
    });
  });

  it("fails the construct check when CreateUserRequest is not constructed", () => {
    const result = pythonMapperAdapter.validate(
      "class CreateUserRequestMapper:\n    def map(self, raw):\n        return None\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
