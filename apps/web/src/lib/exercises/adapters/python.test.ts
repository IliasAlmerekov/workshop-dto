import { describe, expect, it } from "vitest";
import { pythonAdapter } from "./python";

describe("pythonAdapter.validate", () => {
  it("accepts the model solution", () => {
    const result = pythonAdapter.validate(pythonAdapter.solutionCode);
    expect(result.passed).toBe(true);
  });

  it("rejects a typical invalid solution (not frozen) without leaking the fix", () => {
    const doc = `from dataclasses import dataclass
from datetime import date


@dataclass
class CreateUserRequest:
    userName: str
    firstName: str
    lastName: str
    birthDate: date
    email: str
`;
    const result = pythonAdapter.validate(doc);
    expect(result.passed).toBe(false);
    const construct = result.checks.find((c) => c.id === "construct");
    expect(construct?.passed).toBe(false);
    expect(construct?.message).not.toMatch(/frozen=True\)\s*$/m);
  });

  it("accepts an equivalent solution with spaced-out decorator kwarg syntax", () => {
    const doc = `from dataclasses import dataclass
from datetime import date


@dataclass(frozen = True)
class CreateUserRequest:
    userName: str
    firstName: str
    lastName: str
    birthDate: date
    email: str
`;
    const result = pythonAdapter.validate(doc);
    expect(result.passed).toBe(true);
  });

  it("reports a missing field by name", () => {
    const doc = `from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class CreateUserRequest:
    userName: str
    firstName: str
    lastName: str
    birthDate: date
`;
    const result = pythonAdapter.validate(doc);
    expect(result.checks.find((c) => c.id === "field-email")).toMatchObject({
      passed: false,
    });
  });

  it("fails every check when no CreateUserRequest class is declared at all", () => {
    const result = pythonAdapter.validate("x = 1\n");
    expect(result.passed).toBe(false);
    expect(result.checks.find((c) => c.id === "construct")?.passed).toBe(false);
  });
});
