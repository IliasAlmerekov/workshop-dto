/**
 * Extracts the first sentence of `text`, including its terminating period.
 * Unlike `text.split(". ")[0] + "."`, this doesn't assume a ". " separator
 * exists: a single-sentence input (with or without a trailing period) is
 * returned as-is instead of gaining a duplicated period.
 */
export function firstSentence(text: string): string {
  const match = /^[^.]*\./.exec(text);
  return match ? match[0] : text;
}
