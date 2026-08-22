import { describe, expect, it } from "vitest";
import { javaIdentityMapperAdapter } from "./javaIdentityMapper";

describe("javaIdentityMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = javaIdentityMapperAdapter.validate(
      javaIdentityMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (missing the VERIFIED comparison) without leaking the fix", () => {
    const doc = `import java.time.Instant;
import java.util.Map;

public final class IdentityCheckResultMapper {
    public IdentityCheckResult map(Map<String, String> raw) {
        return new IdentityCheckResult(
            Integer.parseInt(raw.get("subject_id")),
            true,
            Instant.parse(raw.get("checked_at"))
        );
    }
}
`;
    const result = javaIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const source = result.checks.find((c) => c.id === "field-verified-source");
    expect(source?.passed).toBe(false);
    const comparison = result.checks.find(
      (c) => c.id === "field-verified-comparison",
    );
    expect(comparison?.passed).toBe(false);
    expect(comparison?.message).not.toMatch(/\.equals\("VERIFIED"\)/);
  });

  it("accepts an equivalent solution with extra whitespace", () => {
    const doc = `import java.time.Instant;
import java.util.Map;

public final class IdentityCheckResultMapper {
    public IdentityCheckResult map(Map<String, String> raw) {
        return new IdentityCheckResult(
            Integer.parseInt( raw.get("subject_id") ),
            raw.get("verification_state").equals("VERIFIED"),
            Instant.parse(raw.get("checked_at"))
        );
    }
}
`;
    const result = javaIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("rejects wrong argument order — fields are matched positionally", () => {
    const doc = `import java.time.Instant;
import java.util.Map;

public final class IdentityCheckResultMapper {
    public IdentityCheckResult map(Map<String, String> raw) {
        return new IdentityCheckResult(
            raw.get("verification_state").equals("VERIFIED"),
            Integer.parseInt(raw.get("subject_id")),
            Instant.parse(raw.get("checked_at"))
        );
    }
}
`;
    const result = javaIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(
      result.checks.find((c) => c.id === "field-userId-source")?.passed,
    ).toBe(false);
    expect(
      result.checks.find((c) => c.id === "field-verified-source")?.passed,
    ).toBe(false);
  });

  it("reports a missing field when an argument is dropped", () => {
    const doc = `import java.time.Instant;
import java.util.Map;

public final class IdentityCheckResultMapper {
    public IdentityCheckResult map(Map<String, String> raw) {
        return new IdentityCheckResult(
            Integer.parseInt(raw.get("subject_id")),
            raw.get("verification_state").equals("VERIFIED")
        );
    }
}
`;
    const result = javaIdentityMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-checkedAt")).toMatchObject(
      {
        passed: false,
        message: expect.stringContaining("checkedAt"),
      },
    );
  });

  it("fails the construct check when IdentityCheckResult is not constructed", () => {
    const result = javaIdentityMapperAdapter.validate(
      "public final class IdentityCheckResultMapper {\n    public IdentityCheckResult map(Object raw) {\n        return null;\n    }\n}\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
