import { describe, expect, it } from "vitest";
import { javaAdapter } from "./java";

describe("javaAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = javaAdapter.validate(javaAdapter.solutionCode);
    expect(result.passed).toBe(true);
  });

  it("rejects a typical invalid solution (plain class instead of record) without leaking the fix", () => {
    const doc = `import java.time.LocalDate;

public class CreateUserRequest {
    public String userName;
    public String firstName;
    public String lastName;
    public LocalDate birthDate;
    public String email;
}
`;
    const result = javaAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const construct = result.checks.find((c) => c.id === "construct");
    expect(construct?.passed).toBe(false);
    expect(construct?.message).not.toMatch(/String userName,/);
  });

  it("accepts an equivalent solution with a non-empty body and trailing whitespace", () => {
    const doc = `import java.time.LocalDate;

public record CreateUserRequest(
    String userName,
    String firstName,
    String lastName,
    LocalDate birthDate,
    String email
) {

}
`;
    const result = javaAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `import java.time.LocalDate;

public record CreateUserRequest(
    String userName,
    String firstName,
    String lastName,
    LocalDate birthDate
) {}
`;
    const result = javaAdapter.validate(doc);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
    });
  });

  it("reports a wrong type for a field", () => {
    const doc = `import java.time.LocalDate;

public record CreateUserRequest(
    String userName,
    String firstName,
    String lastName,
    String birthDate,
    String email
) {}
`;
    const result = javaAdapter.validate(doc);
    expect(result.checks.find((c) => c.id === "field-birthDate")).toMatchObject(
      {
        passed: false,
      },
    );
  });

  it("fails every check when no CreateUserRequest record is declared at all", () => {
    const result = javaAdapter.validate("public class Nothing {}\n");
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
