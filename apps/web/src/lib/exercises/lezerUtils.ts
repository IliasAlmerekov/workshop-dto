import type { SyntaxNode } from "@lezer/common";

/** The exact source text a node covers. */
export function textOf(node: SyntaxNode, doc: string): string {
  return doc.slice(node.from, node.to);
}

/** First direct child whose node name matches, or null. */
export function child(node: SyntaxNode, name: string): SyntaxNode | null {
  let c = node.firstChild;
  while (c) {
    if (c.name === name) {
      return c;
    }
    c = c.nextSibling;
  }
  return null;
}

/** All direct children whose node name matches. */
export function children(node: SyntaxNode, name: string): SyntaxNode[] {
  const found: SyntaxNode[] = [];
  let c = node.firstChild;
  while (c) {
    if (c.name === name) {
      found.push(c);
    }
    c = c.nextSibling;
  }
  return found;
}

/**
 * Depth-first search for every descendant (including self) whose node name
 * matches, stopping the descent at each match (so a match's own children of
 * the same name — unusual, but possible in recursive grammars — aren't
 * double-collected).
 */
export function findAll(node: SyntaxNode, name: string): SyntaxNode[] {
  const found: SyntaxNode[] = [];
  const cursor = node.cursor();
  do {
    if (cursor.name === name) {
      found.push(cursor.node);
      // Don't descend into a match; task constructs never nest inside themselves.
      if (!cursor.next(false)) {
        break;
      }
      continue;
    }
    // A bare TreeCursor.next() walks past this node's own end into whatever
    // follows it in the whole document (verified empirically against
    // @lezer/common) — it is not bounded to the subtree it started in, so
    // that has to be enforced here or a scoped search (e.g. "methods inside
    // this one class") leaks matches from unrelated, later code.
  } while (cursor.next() && cursor.from < node.to);
  return found;
}

/** True if any descendant (or the node itself) is an error-recovery node whose exact text matches. */
export function hasErrorTokenWithText(
  node: SyntaxNode,
  doc: string,
  text: string,
): boolean {
  let c = node.firstChild;
  while (c) {
    if (c.type.isError && textOf(c, doc).trim() === text) {
      return true;
    }
    if (hasErrorTokenWithText(c, doc, text)) {
      return true;
    }
    c = c.nextSibling;
  }
  return node.type.isError && textOf(node, doc).trim() === text;
}

function stripQuotes(text: string): string {
  const trimmed = text.trim();
  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if (
    (first === "'" || first === '"') &&
    first === last &&
    trimmed.length >= 2
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

/**
 * True if some node anywhere in this subtree covers exactly `text` (quotes
 * stripped, so a PHP/Python string-keyed access like `$raw['user_name']` and
 * a plain identifier access like `raw.user_name` both match the same way).
 * Deliberately loose about exact expression shape — spec section 9.2 allows
 * equivalent expressions, not just one exact form — but exact-equality on
 * the candidate node's own text (not a substring search) keeps a composite
 * node's much longer text from matching by coincidence.
 */
export function subtreeContainsToken(
  node: SyntaxNode,
  doc: string,
  text: string,
): boolean {
  const cursor = node.cursor();
  do {
    if (/Comment/.test(cursor.name)) {
      continue;
    }
    if (stripQuotes(textOf(cursor.node, doc)) === text) {
      return true;
    }
    // A bare TreeCursor.next() walks past this node's own end into whatever
    // follows it in the whole document (verified empirically) — it is not
    // bounded to the subtree it started in, so that has to be enforced here.
  } while (cursor.next() && cursor.from < node.to);
  return false;
}
