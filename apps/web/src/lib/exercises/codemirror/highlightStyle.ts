import { HighlightStyle } from "@codemirror/language";
import { tags } from "@lezer/highlight";

/**
 * The editor's syntax colours, bound to the same `--syntax-*` tokens the
 * static code blocks use (`lib/workshop/highlight.ts`), so the same snippet
 * reads identically whether it is being typed or merely shown.
 *
 * Why this file exists at all: `basicSetup` ships CodeMirror's
 * `defaultHighlightStyle`, whose palette is fixed and tuned for a white page —
 * it paints variables and property names `#00f`/`#05a`. On the dark theme's
 * `#131316` that turned everything a participant types blue, at a contrast no
 * token in DESIGN.md would allow. Overriding it is the only way out: a
 * highlighter cannot be "unset" per theme.
 *
 * The names a participant writes — variables, fields, parameters, functions —
 * carry no colour of their own and inherit `--code-foreground` (near-black on
 * light, near-white on dark). Colour is spent on what is *not* their code:
 * language keywords, types, literals, comments and punctuation. Every tag
 * that could otherwise reach the default style is listed, since the fallback
 * is per-tag, not per-style.
 */
export const workshopHighlightStyle = HighlightStyle.define([
  {
    tag: [
      tags.keyword,
      tags.controlKeyword,
      tags.definitionKeyword,
      tags.moduleKeyword,
      tags.operatorKeyword,
      tags.self,
      tags.modifier,
      tags.meta,
      tags.annotation,
    ],
    color: "var(--syntax-keyword)",
  },
  {
    tag: [
      tags.typeName,
      tags.className,
      tags.namespace,
      tags.standard(tags.typeName),
      tags.definition(tags.typeName),
    ],
    color: "var(--syntax-type)",
  },
  {
    tag: [
      tags.string,
      tags.special(tags.string),
      tags.regexp,
      tags.character,
      tags.number,
      tags.integer,
      tags.float,
      tags.bool,
      tags.atom,
      tags.null,
      tags.escape,
    ],
    color: "var(--syntax-string)",
  },
  {
    tag: [tags.comment, tags.lineComment, tags.blockComment, tags.docComment],
    color: "var(--syntax-comment)",
    fontStyle: "italic",
  },
  {
    tag: [
      tags.operator,
      tags.punctuation,
      tags.separator,
      tags.bracket,
      tags.angleBracket,
      tags.squareBracket,
      tags.paren,
      tags.brace,
      tags.derefOperator,
    ],
    color: "var(--syntax-punct)",
  },
  {
    // The participant's own vocabulary: uncoloured on purpose.
    tag: [
      tags.name,
      tags.variableName,
      tags.propertyName,
      tags.attributeName,
      tags.labelName,
      tags.definition(tags.variableName),
      tags.definition(tags.propertyName),
      tags.function(tags.variableName),
      tags.function(tags.propertyName),
      tags.special(tags.variableName),
      tags.local(tags.variableName),
      tags.constant(tags.variableName),
    ],
    color: "var(--code-foreground)",
  },
]);
