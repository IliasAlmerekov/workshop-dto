import { describe, expect, it } from "vitest";
import { javaResponseMapperAdapter } from "./javaResponseMapper";

describe("javaResponseMapperAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = javaResponseMapperAdapter.validate(
      javaResponseMapperAdapter.solutionCode,
    );
    expect(result.passed).toBe(true);
    expect(result.checks.every((c) => c.passed)).toBe(true);
  });

  it("rejects a typical invalid solution (birthDate not formatted) without leaking the fix", () => {
    const doc = `import java.time.format.DateTimeFormatter;

public final class UserResponseMapper {
    public UserResponse map(User user) {
        return new UserResponse(
            user.id(),
            user.userName(),
            user.firstName() + " " + user.lastName(),
            user.birthDate(),
            user.email()
        );
    }
}
`;
    const result = javaResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const format = result.checks.find((c) => c.id === "field-birthDate-format");
    expect(format?.passed).toBe(false);
    expect(format?.message).not.toMatch(/DateTimeFormatter/);
    expect(
      result.checks.filter(
        (c) => c.id !== "field-birthDate-format" && !c.passed,
      ),
    ).toHaveLength(0);
  });

  it("accepts an equivalent solution with extra whitespace", () => {
    const doc = `import java.time.format.DateTimeFormatter;

public final class UserResponseMapper {
    public UserResponse map(User user) {
        return new UserResponse(
            user.id(),
            user.userName(),
            user.firstName() + " " + user.lastName(),
            user.birthDate().format( DateTimeFormatter.ISO_LOCAL_DATE ),
            user.email()
        );
    }
}
`;
    const result = javaResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("rejects wrong argument order — fields are matched positionally", () => {
    const doc = `import java.time.format.DateTimeFormatter;

public final class UserResponseMapper {
    public UserResponse map(User user) {
        return new UserResponse(
            user.userName(),
            user.id(),
            user.firstName() + " " + user.lastName(),
            user.birthDate().format(DateTimeFormatter.ISO_LOCAL_DATE),
            user.email()
        );
    }
}
`;
    const result = javaResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-id-source")?.passed).toBe(
      false,
    );
    expect(
      result.checks.find((c) => c.id === "field-userName-source")?.passed,
    ).toBe(false);
  });

  it("reports a missing field when an argument is dropped", () => {
    const doc = `import java.time.format.DateTimeFormatter;

public final class UserResponseMapper {
    public UserResponse map(User user) {
        return new UserResponse(
            user.id(),
            user.userName(),
            user.firstName() + " " + user.lastName(),
            user.birthDate().format(DateTimeFormatter.ISO_LOCAL_DATE)
        );
    }
}
`;
    const result = javaResponseMapperAdapter.validate(doc);
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
      message: expect.stringContaining("email"),
    });
  });

  it("fails the construct check when UserResponse is not constructed", () => {
    const result = javaResponseMapperAdapter.validate(
      "public final class UserResponseMapper {\n    public UserResponse map(User user) {\n        return null;\n    }\n}\n",
    );
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
