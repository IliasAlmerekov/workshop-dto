import type { Language } from "@/lib/workshop/types";
import type { StarterCode } from "./types";

/** Starter code per language for Task 3 (spec section 6.3), same split convention as task2StarterCode.ts. */
export const TASK3_STARTER_CODE: Record<Language, StarterCode> = {
  typescript: {
    before: `export function mapIdentityCheck(raw: {
  subject_id: string;
  verification_state: string;
  checked_at: string;
}): IdentityCheckResult {
  return {
`,
    editable:
      "    // TODO: convert subject_id, verification_state, and checked_at\n",
    after: "  };\n}\n",
  },
  php: {
    before: `<?php

final class IdentityCheckResultMapper
{
    public function map(array $raw): IdentityCheckResult
    {
        return new IdentityCheckResult(
`,
    editable:
      "            // TODO: convert subject_id, verification_state, and checked_at\n",
    after: "        );\n    }\n}\n",
  },
  python: {
    before: `from datetime import datetime


class IdentityCheckResultMapper:
    def map(self, raw: dict) -> IdentityCheckResult:
        return IdentityCheckResult(
`,
    editable:
      "            # TODO: convert subject_id, verification_state, and checked_at\n",
    after: "        )\n",
  },
  java: {
    before: `import java.time.Instant;
import java.util.Map;

public final class IdentityCheckResultMapper {
    public IdentityCheckResult map(Map<String, String> raw) {
        return new IdentityCheckResult(
`,
    editable:
      "            // TODO: convert subject_id, verification_state, and checked_at\n",
    after: "        );\n    }\n}\n",
  },
};
