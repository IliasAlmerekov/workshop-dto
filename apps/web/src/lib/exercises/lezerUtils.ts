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
  } while (cursor.next());
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
