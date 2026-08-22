import { describe, expect, it } from "vitest";
import { pythonIdentityMapperAdapter } from "./pythonIdentityMapper";

describe("pythonIdentityMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = pythonIdentityMapperAdapter.validate(
      pythonIdentityMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (checked_at left as text) without leaking the fix", () => {
    const doc = `from datetime import datetime


class IdentityCheckResultMapper:
    def map(self, raw: dict) -> IdentityCheckResult:
        return IdentityCheckResult(
            userId=int(raw["subject_id"]),
            verified=raw["verification_state"] == "VERIFIED",
            checkedAt=raw["checked_at"],
        )
`;
    const result = pythonIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const dateCheck = result.checks.find(
      (c) => c.id === "field-checkedAt-date",
    );
    expect(dateCheck?.passed).toBe(false);
    expect(dateCheck?.message).not.toMatch(/fromisoformat/);
    expect(
      result.checks.filter((c) => c.id !== "field-checkedAt-date" && !c.passed),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution using single-quoted keys", () => {
    const doc = `from datetime import datetime


class IdentityCheckResultMapper:
    def map(self, raw: dict) -> IdentityCheckResult:
        return IdentityCheckResult(
            userId=int(raw['subject_id']),
            verified=raw['verification_state'] == 'VERIFIED',
            checkedAt=datetime.fromisoformat(raw['checked_at']),
        )
`;
    const result = pythonIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `from datetime import datetime


class IdentityCheckResultMapper:
    def map(self, raw: dict) -> IdentityCheckResult:
        return IdentityCheckResult(
            userId=int(raw["subject_id"]),
            checkedAt=datetime.fromisoformat(raw["checked_at"]),
        )
`;
    const result = pythonIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-verified")).toMatchObject({
      passed: false,
      message: expect.stringContaining("verified"),
    });
  });

  it("fails the construct check when IdentityCheckResult is not constructed", () => {
    const result = pythonIdentityMapperAdapter.validate(
      "class IdentityCheckResultMapper:\n    def map(self, raw):\n        return None\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
