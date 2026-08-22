import { describe, expect, it } from "vitest";
import { phpIdentityMapperAdapter } from "./phpIdentityMapper";

describe("phpIdentityMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = phpIdentityMapperAdapter.validate(
      phpIdentityMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (verified hardcoded to true) without leaking the fix", () => {
    const doc = `<?php

final class IdentityCheckResultMapper
{
    public function map(array $raw): IdentityCheckResult
    {
        return new IdentityCheckResult(
            userId: intval($raw['subject_id']),
            verified: true,
            checkedAt: new \\DateTimeImmutable($raw['checked_at']),
        );
    }
}
`;
    const result = phpIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const source = result.checks.find((c) => c.id === "field-verified-source");
    expect(source?.passed).toBe(false);
    const comparison = result.checks.find(
      (c) => c.id === "field-verified-comparison",
    );
    expect(comparison?.passed).toBe(false);
    expect(source?.message).not.toMatch(/verification_state'\] === 'VERIFIED'/);
  });

  it("accepts an equivalent solution with reordered arguments and no trailing comma", () => {
    const doc = `<?php

final class IdentityCheckResultMapper
{
    public function map(array $raw): IdentityCheckResult
    {
        return new IdentityCheckResult(
            verified: $raw['verification_state'] === 'VERIFIED',
            userId: intval($raw['subject_id']),
            checkedAt: new \\DateTimeImmutable($raw['checked_at'])
        );
    }
}
`;
    const result = phpIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `<?php

final class IdentityCheckResultMapper
{
    public function map(array $raw): IdentityCheckResult
    {
        return new IdentityCheckResult(
            userId: intval($raw['subject_id']),
            verified: $raw['verification_state'] === 'VERIFIED',
        );
    }
}
`;
    const result = phpIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-checkedAt")).toMatchObject(
      {
        passed: false,
        message: expect.stringContaining("checkedAt"),
      },
    );
  });

  it("fails the construct check when IdentityCheckResult is not constructed", () => {
    const result = phpIdentityMapperAdapter.validate(
      "<?php\nfinal class IdentityCheckResultMapper { public function map(array $raw) { return null; } }\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
