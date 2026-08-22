import { describe, expect, it } from "vitest";
import { phpAdapter } from "./php";

describe("phpAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = phpAdapter.validate(phpAdapter.solutionCode);
    expect(result.passed).toBe(true);
  });

  it("rejects a typical invalid solution (missing readonly) without leaking the fix", () => {
    const doc = `<?php

final class CreateUserRequest
{
    public function __construct(
        public string $userName,
        public string $firstName,
        public string $lastName,
        public \\DateTimeImmutable $birthDate,
        public string $email,
    ) {
    }
}
`;
    const result = phpAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const immutable = result.checks.find((c) => c.id === "immutable");
    expect(immutable?.passed).toBe(false);
    expect(immutable?.message).not.toMatch(/public readonly string \$userName/);
  });

  it("accepts an equivalent solution using per-parameter readonly instead of class-level readonly", () => {
    const doc = `<?php

final class CreateUserRequest
{
    public function __construct(
        public readonly string $userName,
        public readonly string $firstName,
        public readonly string $lastName,
        public readonly \\DateTimeImmutable $birthDate,
        public readonly string $email,
    ) {
    }
}
`;
    const result = phpAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `<?php

final readonly class CreateUserRequest
{
    public function __construct(
        public string $userName,
        public string $firstName,
        public string $lastName,
        public \\DateTimeImmutable $birthDate,
    ) {
    }
}
`;
    const result = phpAdapter.validate(doc);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
    });
  });

  it("fails every check when no CreateUserRequest class is declared at all", () => {
    const result = phpAdapter.validate("<?php\n\n// nothing here\n");
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
