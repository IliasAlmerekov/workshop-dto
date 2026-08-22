import { describe, expect, it } from "vitest";
import { phpResponseMapperAdapter } from "./phpResponseMapper";

describe("phpResponseMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = phpResponseMapperAdapter.validate(
      phpResponseMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (internalNote leaked) without leaking the fix", () => {
    const doc = `<?php
final class UserResponseMapper
{
    public function map(User $user): UserResponse
    {
        return new UserResponse(
            id: $user->id,
            userName: $user->userName,
            displayName: trim("{$user->firstName} {$user->lastName}"),
            birthDate: $user->birthDate->format('Y-m-d'),
            email: $user->email,
            internalNote: $user->internalNote,
        );
    }
}
`;
    const result = phpResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const leak = result.checks.find((c) => c.id === "no-leak-internalNote");
    expect(leak?.passed).toBe(false);
    expect(leak?.message).not.toMatch(/\$user->internalNote/);
  });

  it("rejects a typical invalid solution (birthDate not formatted) without leaking the fix", () => {
    const doc = `<?php
final class UserResponseMapper
{
    public function map(User $user): UserResponse
    {
        return new UserResponse(
            id: $user->id,
            userName: $user->userName,
            displayName: trim("{$user->firstName} {$user->lastName}"),
            birthDate: $user->birthDate,
            email: $user->email,
        );
    }
}
`;
    const result = phpResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const format = result.checks.find((c) => c.id === "field-birthDate-format");
    expect(format?.passed).toBe(false);
    expect(format?.message).not.toMatch(/Y-m-d/);
    expect(
      result.checks.filter(
        (c) => c.id !== "field-birthDate-format" && !c.passed,
      ),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution using sprintf and reordered arguments", () => {
    const doc = `<?php
final class UserResponseMapper
{
    public function map(User $user): UserResponse
    {
        return new UserResponse(
            email: $user->email,
            birthDate: $user->birthDate->format('Y-m-d'),
            displayName: sprintf('%s %s', $user->firstName, $user->lastName),
            userName: $user->userName,
            id: $user->id
        );
    }
}
`;
    const result = phpResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `<?php
final class UserResponseMapper
{
    public function map(User $user): UserResponse
    {
        return new UserResponse(
            id: $user->id,
            displayName: trim("{$user->firstName} {$user->lastName}"),
            birthDate: $user->birthDate->format('Y-m-d'),
            email: $user->email,
        );
    }
}
`;
    const result = phpResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-userName")).toMatchObject({
      passed: false,
      message: expect.stringContaining("userName"),
    });
  });

  it("fails the construct check when UserResponse is not constructed", () => {
    const result = phpResponseMapperAdapter.validate(
      "<?php\nfinal class UserResponseMapper { public function map(User $user) { return null; } }\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
