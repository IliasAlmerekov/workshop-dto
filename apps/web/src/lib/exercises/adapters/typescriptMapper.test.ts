import { describe, expect, it } from "vitest";
import { typescriptMapperAdapter } from "./typescriptMapper";

describe("typescriptMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = typescriptMapperAdapter.validate(
      typescriptMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (missing lowercase on userName) without leaking the fix", () => {
    const doc = `export function mapCreateUserRequest(raw: {
  user_name: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
}): CreateUserRequest {
  return {
    userName: raw.user_name.trim(),
    firstName: raw.first_name.trim(),
    lastName: raw.last_name.trim(),
    birthDate: new Date(raw.birth_date.trim()),
    email: raw.email.trim().toLowerCase(),
  };
}
`;
    const result = typescriptMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const lowercase = result.checks.find(
      (c) => c.id === "field-userName-lowercase",
    );
    expect(lowercase?.passed).toBe(false);
    expect(lowercase?.message).not.toMatch(/toLowerCase\(\)/);
    // Every other field's checks must still pass — the failure is isolated.
    expect(
      result.checks.filter(
        (c) => c.id !== "field-userName-lowercase" && !c.passed,
      ),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution with a different chain order", () => {
    const doc = `export function mapCreateUserRequest(raw: {
  user_name: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
}): CreateUserRequest {
  return {
    userName: raw.user_name.toLowerCase().trim(),
    firstName: raw.first_name.trim(),
    lastName: raw.last_name.trim(),
    birthDate: new Date(raw.birth_date.trim()),
    email: raw.email.toLowerCase().trim(),
  };
}
`;
    const result = typescriptMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `export function mapCreateUserRequest(raw: {
  user_name: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
}): CreateUserRequest {
  return {
    userName: raw.user_name.trim().toLowerCase(),
    firstName: raw.first_name.trim(),
    lastName: raw.last_name.trim(),
    birthDate: new Date(raw.birth_date.trim()),
  };
}
`;
    const result = typescriptMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
      message: expect.stringContaining("email"),
    });
  });

  it("fails the construct check when no object is returned at all", () => {
    const result = typescriptMapperAdapter.validate(
      "export function mapCreateUserRequest(raw: unknown) { return null; }\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
