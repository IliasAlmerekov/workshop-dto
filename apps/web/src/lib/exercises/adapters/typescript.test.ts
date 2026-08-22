import { describe, expect, it } from "vitest";
import { typescriptAdapter } from "./typescript";

describe("typescriptAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = typescriptAdapter.validate(typescriptAdapter.solutionCode);
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (missing readonly) without leaking the fix", () => {
    const doc = `export type CreateUserRequest = {
  userName: string;
  firstName: string;
  lastName: string;
  birthDate: Date;
  email: string;
};
`;
    const result = typescriptAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const immutable = result.checks.find((c) => c.id === "immutable");
    expect(immutable?.passed).toBe(false);
    expect(immutable?.message).not.toMatch(/readonly userName: string/);
  });

  it("accepts an equivalent solution using a class with promoted readonly parameters", () => {
    const doc = `export class CreateUserRequest {
  constructor(
    readonly userName: string,
    readonly firstName: string,
    readonly lastName: string,
    readonly birthDate: Date,
    readonly email: string,
  ) {}
}
`;
    const result = typescriptAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `export type CreateUserRequest = {
  readonly userName: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: Date;
};
`;
    const result = typescriptAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
      message: expect.stringContaining("email"),
    });
  });

  it("reports a wrong type for a field", () => {
    const doc = `export type CreateUserRequest = {
  readonly userName: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly birthDate: string;
  readonly email: string;
};
`;
    const result = typescriptAdapter.validate(doc);
    expect(result.checks.find((c) => c.id === "field-birthDate")).toMatchObject(
      {
        passed: false,
      },
    );
  });

  it("fails every check when no CreateUserRequest is declared at all", () => {
    const result = typescriptAdapter.validate("export const nothing = 1;\n");
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
