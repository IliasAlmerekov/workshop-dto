import type { Extension } from "@codemirror/state";
import type { Language } from "@/lib/workshop/types";

/** Each branch is its own dynamic import, so only the active track's grammar loads. */
export async function loadLanguageExtension(
  language: Language,
): Promise<Extension> {
  switch (language) {
    case "typescript": {
      const { javascript } = await import("@codemirror/lang-javascript");
      return javascript({ typescript: true });
    }
    case "php": {
      const { php } = await import("@codemirror/lang-php");
      return php();
    }
    case "python": {
      const { python } = await import("@codemirror/lang-python");
      return python();
    }
    case "java": {
      const { java } = await import("@codemirror/lang-java");
      return java();
    }
  }
}
