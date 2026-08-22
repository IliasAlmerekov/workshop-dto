import { describe, expect, it } from "vitest";
import { typescriptResponseMapperAdapter } from "./typescriptResponseMapper";

describe("typescriptResponseMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = typescriptResponseMapperAdapter.validate(
      typescriptResponseMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (passwordHash leaked) without leaking the fix", () => {
    const doc = `export function mapUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    userName: user.userName,
    displayName: \`\${user.firstName} \${user.lastName}\`,
    birthDate: user.birthDate.toISOString().slice(0, 10),
    email: user.email,
    passwordHash: user.passwordHash,
  };
}
`;
    const result = typescriptResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const leak = result.checks.find((c) => c.id === "no-leak-passwordHash");
    expect(leak?.passed).toBe(false);
    expect(leak?.message).not.toMatch(/user\.passwordHash/);
  });

  it("rejects a typical invalid solution (displayName missing lastName) without leaking the fix", () => {
    const doc = `export function mapUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    userName: user.userName,
    displayName: user.firstName,
    birthDate: user.birthDate.toISOString().slice(0, 10),
    email: user.email,
  };
}
`;
    const result = typescriptResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const lastName = result.checks.find(
      (c) => c.id === "field-displayName-lastName",
    );
    expect(lastName?.passed).toBe(false);
    expect(
      result.checks.filter(
        (c) => c.id !== "field-displayName-lastName" && !c.passed,
      ),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution using string concatenation and reordered fields", () => {
    const doc = `export function mapUserResponse(user: User): UserResponse {
  return {
    email: user.email,
    birthDate: user.birthDate.toISOString().slice(0, 10),
    displayName: user.firstName + " " + user.lastName,
    userName: user.userName,
    id: user.id,
  };
}
`;
    const result = typescriptResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `export function mapUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    userName: user.userName,
    displayName: \`\${user.firstName} \${user.lastName}\`,
    birthDate: user.birthDate.toISOString().slice(0, 10),
  };
}
`;
    const result = typescriptResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
      message: expect.stringContaining("email"),
    });
  });

  it("fails the construct check when no object is returned at all", () => {
    const result = typescriptResponseMapperAdapter.validate(
      "export function mapUserResponse(user: unknown) { return null; }\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
