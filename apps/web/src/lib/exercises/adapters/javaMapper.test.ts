import { describe, expect, it } from "vitest";
import { javaMapperAdapter } from "./javaMapper";

describe("javaMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = javaMapperAdapter.validate(javaMapperAdapter.solutionCode);
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (missing lowercase on email) without leaking the fix", () => {
    const doc = `import java.time.LocalDate;
import java.util.Map;

public final class CreateUserRequestMapper {
    public CreateUserRequest map(Map<String, String> raw) {
        return new CreateUserRequest(
            raw.get("user_name").trim().toLowerCase(),
            raw.get("first_name").trim(),
            raw.get("last_name").trim(),
            LocalDate.parse(raw.get("birth_date").trim()),
            raw.get("email").trim()
        );
    }
}
`;
    const result = javaMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const lowercase = result.checks.find(
      (c) => c.id === "field-email-lowercase",
    );
    expect(lowercase?.passed).toBe(false);
    expect(lowercase?.message).not.toMatch(/toLowerCase\(\)/);
    expect(
      result.checks.filter(
        (c) => c.id !== "field-email-lowercase" && !c.passed,
      ),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution with extra whitespace", () => {
    const doc = `import java.time.LocalDate;
import java.util.Map;

public final class CreateUserRequestMapper {
    public CreateUserRequest map(Map<String, String> raw) {
        return new CreateUserRequest(
            raw.get("user_name").trim().toLowerCase(),
            raw.get("first_name").trim(),
            raw.get("last_name").trim(),
            LocalDate.parse( raw.get("birth_date").trim() ),
            raw.get("email").trim().toLowerCase()
        );
    }
}
`;
    const result = javaMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("rejects wrong argument order — fields are matched positionally", () => {
    const doc = `import java.time.LocalDate;
import java.util.Map;

public final class CreateUserRequestMapper {
    public CreateUserRequest map(Map<String, String> raw) {
        return new CreateUserRequest(
            raw.get("first_name").trim(),
            raw.get("user_name").trim().toLowerCase(),
            raw.get("last_name").trim(),
            LocalDate.parse(raw.get("birth_date").trim()),
            raw.get("email").trim().toLowerCase()
        );
    }
}
`;
    const result = javaMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(
      result.checks.find((c) => c.id === "field-userName-source")?.passed,
    ).toBe(false);
    expect(
      result.checks.find((c) => c.id === "field-firstName-source")?.passed,
    ).toBe(false);
  });

  it("reports a missing field when an argument is dropped", () => {
    const doc = `import java.time.LocalDate;
import java.util.Map;

public final class CreateUserRequestMapper {
    public CreateUserRequest map(Map<String, String> raw) {
        return new CreateUserRequest(
            raw.get("user_name").trim().toLowerCase(),
            raw.get("first_name").trim(),
            raw.get("last_name").trim(),
            LocalDate.parse(raw.get("birth_date").trim())
        );
    }
}
`;
    const result = javaMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
      message: expect.stringContaining("email"),
    });
  });

  it("fails the construct check when CreateUserRequest is not constructed", () => {
    const result = javaMapperAdapter.validate(
      "public final class CreateUserRequestMapper {\n    public CreateUserRequest map(Object raw) {\n        return null;\n    }\n}\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
