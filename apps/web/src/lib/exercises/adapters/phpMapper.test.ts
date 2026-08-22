import { describe, expect, it } from "vitest";
import { phpMapperAdapter } from "./phpMapper";

describe("phpMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = phpMapperAdapter.validate(phpMapperAdapter.solutionCode);
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (missing trim on firstName) without leaking the fix", () => {
    const doc = `<?php

final class CreateUserRequestMapper
{
    public function map(array $raw): CreateUserRequest
    {
        return new CreateUserRequest(
            userName: strtolower(trim($raw['user_name'])),
            firstName: $raw['first_name'],
            lastName: trim($raw['last_name']),
            birthDate: new \\DateTimeImmutable(trim($raw['birth_date'])),
            email: strtolower(trim($raw['email'])),
        );
    }
}
`;
    const result = phpMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const trim = result.checks.find((c) => c.id === "field-firstName-trim");
    expect(trim?.passed).toBe(false);
    expect(trim?.message).not.toMatch(/trim\(\$raw\['first_name'\]\)/);
    expect(
      result.checks.filter((c) => c.id !== "field-firstName-trim" && !c.passed),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution with reordered arguments and no trailing comma", () => {
    const doc = `<?php

final class CreateUserRequestMapper
{
    public function map(array $raw): CreateUserRequest
    {
        return new CreateUserRequest(
            firstName: trim($raw['first_name']),
            userName: strtolower(trim($raw['user_name'])),
            lastName: trim($raw['last_name']),
            email: strtolower(trim($raw['email'])),
            birthDate: new \\DateTimeImmutable(trim($raw['birth_date']))
        );
    }
}
`;
    const result = phpMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `<?php

final class CreateUserRequestMapper
{
    public function map(array $raw): CreateUserRequest
    {
        return new CreateUserRequest(
            userName: strtolower(trim($raw['user_name'])),
            firstName: trim($raw['first_name']),
            lastName: trim($raw['last_name']),
            birthDate: new \\DateTimeImmutable(trim($raw['birth_date'])),
        );
    }
}
`;
    const result = phpMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
      message: expect.stringContaining("email"),
    });
  });

  it("fails the construct check when CreateUserRequest is not constructed", () => {
    const result = phpMapperAdapter.validate(
      "<?php\nfinal class CreateUserRequestMapper { public function map(array $raw) { return null; } }\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
