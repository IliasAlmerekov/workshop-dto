import type { Language } from "@/lib/workshop/types";
import type { StarterCode } from "./types";

export { composeSolution } from "./composeSolution";

/**
 * Just the starter-code text per language, with no grammar/validator
 * imports — kept separate from the adapters (which pull in
 * @codemirror/lang-* packages) so code that only needs to compare
 * "is this still the untouched starter code" doesn't drag the editor's
 * heavy, dynamically-loaded dependencies into the main bundle.
 */
export const TASK1_STARTER_CODE: Record<Language, StarterCode> = {
  typescript: {
    before: "export type CreateUserRequest = {\n",
    editable: "  // TODO: declare the five readonly fields\n",
    after: "};\n",
  },
  php: {
    before:
      "<?php\n\nfinal readonly class CreateUserRequest\n{\n    public function __construct(\n",
    editable: "        // TODO: declare the five typed, promoted properties\n",
    after: "    ) {\n    }\n}\n",
  },
  python: {
    before:
      "from dataclasses import dataclass\nfrom datetime import date\n\n\n@dataclass(frozen=True)\nclass CreateUserRequest:\n",
    editable: "    # TODO: declare the five typed fields\n    pass\n",
    after: "",
  },
  java: {
    before: "import java.time.LocalDate;\n\npublic record CreateUserRequest(\n",
    editable: "    // TODO: declare the five typed components\n",
    after: ") {}\n",
  },
};
