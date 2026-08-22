import { describe, expect, it } from "vitest";
import { pythonResponseMapperAdapter } from "./pythonResponseMapper";

describe("pythonResponseMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = pythonResponseMapperAdapter.validate(
      pythonResponseMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (passwordHash leaked) without leaking the fix", () => {
    const doc = `class UserResponseMapper:
    def map(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            userName=user.userName,
            displayName=f"{user.firstName} {user.lastName}",
            birthDate=user.birthDate.strftime("%Y-%m-%d"),
            email=user.email,
            passwordHash=user.passwordHash,
        )
`;
    const result = pythonResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const leak = result.checks.find((c) => c.id === "no-leak-passwordHash");
    expect(leak?.passed).toBe(false);
    expect(leak?.message).not.toMatch(/user\.passwordHash/);
  });

  it("rejects a typical invalid solution (birthDate not formatted) without leaking the fix", () => {
    const doc = `class UserResponseMapper:
    def map(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            userName=user.userName,
            displayName=f"{user.firstName} {user.lastName}",
            birthDate=user.birthDate,
            email=user.email,
        )
`;
    const result = pythonResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const format = result.checks.find((c) => c.id === "field-birthDate-format");
    expect(format?.passed).toBe(false);
    expect(format?.message).not.toMatch(/strftime/);
    expect(
      result.checks.filter(
        (c) => c.id !== "field-birthDate-format" && !c.passed,
      ),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution using single-quoted format and reordered keywords", () => {
    const doc = `class UserResponseMapper:
    def map(self, user: User) -> UserResponse:
        return UserResponse(
            email=user.email,
            birthDate=user.birthDate.strftime('%Y-%m-%d'),
            displayName=f'{user.firstName} {user.lastName}',
            userName=user.userName,
            id=user.id,
        )
`;
    const result = pythonResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `class UserResponseMapper:
    def map(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            userName=user.userName,
            birthDate=user.birthDate.strftime("%Y-%m-%d"),
            email=user.email,
        )
`;
    const result = pythonResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(
      result.checks.find((c) => c.id === "field-displayName"),
    ).toMatchObject({
      passed: false,
      message: expect.stringContaining("displayName"),
    });
  });

  it("fails the construct check when UserResponse is not constructed", () => {
    const result = pythonResponseMapperAdapter.validate(
      "class UserResponseMapper:\n    def map(self, user):\n        return None\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
