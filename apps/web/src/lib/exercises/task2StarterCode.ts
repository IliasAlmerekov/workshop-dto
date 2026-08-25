import type { Language } from "@/lib/workshop/types";
import type { StarterCode } from "./types";

/** Starter code per language for Task 2 (spec section 6.2), same split convention as task1StarterCode.ts. */
export const TASK2_STARTER_CODE: Record<Language, StarterCode> = {
  typescript: {
    before: `export function mapCreateUserRequest(form: {
  user_name: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  email: string;
}): CreateUserRequest {
  return {
`,
    editable: "    // TODO: rename, trim, normalize, and convert each field\n",
    after: "  };\n}\n",
  },
  php: {
    before: `<?php

final class CreateUserRequestMapper
{
    public function map(array $form): CreateUserRequest
    {
        return new CreateUserRequest(
`,
    editable:
      "            // TODO: rename, trim, normalize, and convert each field\n",
    after: "        );\n    }\n}\n",
  },
  python: {
    before: `from datetime import date


class CreateUserRequestMapper:
    def map(self, form: dict) -> CreateUserRequest:
        return CreateUserRequest(
`,
    editable:
      "            # TODO: rename, trim, normalize, and convert each field\n",
    after: "        )\n",
  },
  java: {
    before: `import java.time.LocalDate;
import java.util.Map;

public final class CreateUserRequestMapper {
    public CreateUserRequest map(Map<String, String> form) {
        return new CreateUserRequest(
`,
    editable:
      "            // TODO: rename, trim, normalize, and convert each field\n",
    after: "        );\n    }\n}\n",
  },
};
