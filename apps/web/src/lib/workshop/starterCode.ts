import type { Language, TaskId } from "./types";

/**
 * Starter code per task and language track. Content, data, and learning goals
 * are identical across tracks; only syntax differs (spec section 13).
 */
const STARTER_CODE: Record<TaskId, Record<Language, string>> = {
  "request-dto": {
    typescript: `export type CreateUserRequest = {
  // TODO: define readonly properties
}`,
    php: `final readonly class CreateUserRequest
{
    // TODO: define constructor properties
}`,
    python: `@dataclass(frozen=True)
class CreateUserRequest:
    # TODO: define typed fields
    pass`,
    java: `public record CreateUserRequest(
    // TODO: define record components
) {}`,
  },
  "request-mapper": {
    typescript: `export function mapCreateUserRequest(raw: RawInput): CreateUserRequest {
  return {
    // TODO: rename, trim, lowercase, convert
  }
}`,
    php: `final class CreateUserRequestMapper
{
    public function map(array $raw): CreateUserRequest
    {
        // TODO: rename, trim, lowercase, convert
    }
}`,
    python: `class CreateUserRequestMapper:
    def map(self, raw: dict) -> CreateUserRequest:
        # TODO: rename, trim, lowercase, convert
        ...`,
    java: `public final class CreateUserRequestMapper {
    public CreateUserRequest map(Map<String, String> raw) {
        // TODO: rename, trim, lowercase, convert
    }
}`,
  },
  "external-api": {
    typescript: `export function mapIdentityCheck(raw: IdentityResponse): IdentityCheckResult {
  return {
    // TODO: subject_id, verification_state, checked_at
  }
}`,
    php: `final class IdentityCheckResultMapper
{
    public function map(array $raw): IdentityCheckResult
    {
        // TODO: subject_id, verification_state, checked_at
    }
}`,
    python: `class IdentityCheckResultMapper:
    def map(self, raw: dict) -> IdentityCheckResult:
        # TODO: subject_id, verification_state, checked_at
        ...`,
    java: `public final class IdentityCheckResultMapper {
    public IdentityCheckResult map(IdentityResponse raw) {
        // TODO: subject_id, verification_state, checked_at
    }
}`,
  },
  "response-dto": {
    typescript: `export function mapUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    // TODO: userName, displayName, birthDate, email
  }
}`,
    php: `final class UserResponseMapper
{
    public function map(User $user): UserResponse
    {
        return new UserResponse(
            id: $user->getId(),
            // TODO: userName, displayName, birthDate, email
        );
    }
}`,
    python: `class UserResponseMapper:
    def map(self, user: User) -> UserResponse:
        return UserResponse(
            id=user.id,
            # TODO: userName, displayName, birthDate, email
        )`,
    java: `public final class UserResponseMapper {
    public UserResponse map(User user) {
        return new UserResponse(
            user.id()
            // TODO: userName, displayName, birthDate, email
        );
    }
}`,
  },
};

export function starterCode(taskId: TaskId, language: Language): string {
  return STARTER_CODE[taskId][language];
}
