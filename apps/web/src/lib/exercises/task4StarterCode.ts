import type { Language } from "@/lib/workshop/types";
import type { StarterCode } from "./types";

/**
 * Starter code per language for Task 4 (spec section 6.4). The PHP shape
 * mirrors the real production `App\Mapper\UserResponseMapper` exactly (fixed
 * `id` mapping visible, rest TODO), per the issue #7 acceptance criterion.
 */
export const TASK4_STARTER_CODE: Record<Language, StarterCode> = {
  typescript: {
    before: `export function mapUserResponse(user: User): UserResponse {
  return {
    id: user.id,
`,
    editable: "    // TODO: userName, displayName, birthDate, email\n",
    after: "  };\n}\n",
  },
  php: {
    before: `<?php

final class UserResponseMapper
{
    public function map(User $user): UserResponse
    {
        return new UserResponse(
            id: $user->id,
`,
    editable: "            // TODO: userName, displayName, birthDate, email\n",
    after: "        );\n    }\n}\n",
  },
  python: {
    before: `class UserResponseMapper:
    def map(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
`,
    editable: "            # TODO: userName, displayName, birthDate, email\n",
    after: "        )\n",
  },
  java: {
    before: `import java.time.format.DateTimeFormatter;

public final class UserResponseMapper {
    public UserResponse map(User user) {
        return new UserResponse(
            user.id(),
`,
    editable: "            // TODO: userName, displayName, birthDate, email\n",
    after: "        );\n    }\n}\n",
  },
};
