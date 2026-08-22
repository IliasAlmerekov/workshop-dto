export type Token = {
  text: string;
  kind: "comment" | "string" | "keyword" | "type" | "punct" | "plain";
};

const KEYWORDS = new Set([
  "export",
  "type",
  "class",
  "final",
  "readonly",
  "public",
  "private",
  "return",
  "new",
  "function",
  "const",
  "let",
  "def",
  "record",
  "pass",
  "self",
  "this",
  "string",
  "int",
  "bool",
  "boolean",
  "void",
  "dict",
  "array",
]);

/**
 * Deliberately small, language-agnostic tokenizer used only to colour the
 * read-only presentation layer of the editor. It never interprets or executes
 * participant code (spec section 9.1).
 */
export function tokenize(source: string): Token[] {
  const pattern =
    /(\/\/[^\n]*|#[^\n]*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|([A-Za-z_$][\w$]*)|([{}()[\],;:.<>=+\-*/@?|&!]+)|(\s+)/g;

  const tokens: Token[] = [];
  let match: RegExpExecArray | null;
  let lastIndex = 0;

  while ((match = pattern.exec(source)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({
        text: source.slice(lastIndex, match.index),
        kind: "plain",
      });
    }
    lastIndex = pattern.lastIndex;

    const [text, comment, str, word, punct] = match;

    if (comment !== undefined) {
      tokens.push({ text, kind: "comment" });
    } else if (str !== undefined) {
      tokens.push({ text, kind: "string" });
    } else if (word !== undefined) {
      if (KEYWORDS.has(word)) {
        tokens.push({ text, kind: "keyword" });
      } else if (/^[A-Z]/.test(word)) {
        tokens.push({ text, kind: "type" });
      } else {
        tokens.push({ text, kind: "plain" });
      }
    } else if (punct !== undefined) {
      tokens.push({ text, kind: "punct" });
    } else {
      tokens.push({ text, kind: "plain" });
    }
  }

  if (lastIndex < source.length) {
    tokens.push({ text: source.slice(lastIndex), kind: "plain" });
  }

  return tokens;
}

export const TOKEN_COLORS: Record<Token["kind"], string> = {
  comment: "var(--syntax-comment)",
  string: "var(--syntax-string)",
  keyword: "var(--syntax-keyword)",
  type: "var(--syntax-type)",
  punct: "var(--syntax-punct)",
  plain: "var(--foreground)",
};
