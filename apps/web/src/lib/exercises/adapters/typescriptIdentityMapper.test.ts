import { describe, expect, it } from "vitest";
import { typescriptIdentityMapperAdapter } from "./typescriptIdentityMapper";

describe("typescriptIdentityMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = typescriptIdentityMapperAdapter.validate(
      typescriptIdentityMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (subject_id left as text) without leaking the fix", () => {
    const doc = `export function mapIdentityCheck(raw: {
  subject_id: string;
  verification_state: string;
  checked_at: string;
}): IdentityCheckResult {
  return {
    userId: raw.subject_id,
    verified: raw.verification_state === "VERIFIED",
    checkedAt: new Date(raw.checked_at),
  };
}
`;
    const result = typescriptIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const integer = result.checks.find((c) => c.id === "field-userId-integer");
    expect(integer?.passed).toBe(false);
    expect(integer?.message).not.toMatch(/parseInt/);
    expect(
      result.checks.filter((c) => c.id !== "field-userId-integer" && !c.passed),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution with reordered fields and a flipped comparison", () => {
    const doc = `export function mapIdentityCheck(raw: {
  subject_id: string;
  verification_state: string;
  checked_at: string;
}): IdentityCheckResult {
  return {
    checkedAt: new Date(raw.checked_at),
    userId: parseInt(raw.subject_id),
    verified: "VERIFIED" === raw.verification_state,
  };
}
`;
    const result = typescriptIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `export function mapIdentityCheck(raw: {
  subject_id: string;
  verification_state: string;
  checked_at: string;
}): IdentityCheckResult {
  return {
    userId: parseInt(raw.subject_id, 10),
    verified: raw.verification_state === "VERIFIED",
  };
}
`;
    const result = typescriptIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-checkedAt")).toMatchObject(
      {
        passed: false,
        message: expect.stringContaining("checkedAt"),
      },
    );
  });

  it("fails the construct check when no object is returned at all", () => {
    const result = typescriptIdentityMapperAdapter.validate(
      "export function mapIdentityCheck(raw: unknown) { return null; }\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
