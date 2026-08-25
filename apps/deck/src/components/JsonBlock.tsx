import { AnimatePresence, motion } from "framer-motion";
import { MORPH } from "./primitives";

/**
 * The API response, line by line, where each line is a node with an identity.
 *
 * This component exists because the deck's central teaching moment is a
 * *deletion*: nine fields arrive, three of them fall out of the document, two
 * of them merge, and one loses its tail. Rendering the before and after as two
 * code blocks would show the result and hide the act. Rendering them as one
 * list of identified lines means the audience watches the boundary do its work.
 */

export type JsonLineSpec = {
  /** Identity across fragments and slides — this is what morphs. */
  morphId: string;
  key: string;
  value: string;
  /** Marked in Signal Red: has no business leaving the server. */
  danger?: boolean;
};

export function JsonBlock({
  lines,
  flagged,
  width = 830,
}: {
  lines: JsonLineSpec[];
  /** Paint the dangerous lines red. Off on first reveal, on afterwards. */
  flagged?: boolean;
  width?: number;
}) {
  return (
    <motion.div
      layout
      transition={MORPH}
      style={{
        width,
        padding: "var(--spacing-24) var(--spacing-28)",
        borderRadius: "var(--radius-xl)",
        background: "var(--code-bg)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-code-editor)",
        lineHeight: "var(--leading-code-editor)",
      }}
    >
      <Brace>{"{"}</Brace>
      <AnimatePresence initial={false} mode="popLayout">
        {lines.map((line, index) => {
          const danger = Boolean(flagged && line.danger);
          const last = index === lines.length - 1;
          return (
            <motion.div
              key={line.morphId}
              layoutId={`json-${line.morphId}`}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              /* A dropped field falls out of the document. It is the only exit
                 in the deck that moves downward, because it is the only thing
                 the audience should read as discarded. */
              exit={{ opacity: 0, y: 34, filter: "blur(2px)" }}
              transition={MORPH}
              style={{
                paddingLeft: "var(--spacing-24)",
                whiteSpace: "nowrap",
                color: danger ? "var(--code-danger)" : undefined,
              }}
            >
              <span
                style={{
                  color: danger ? "var(--code-danger)" : "var(--code-foreground)",
                }}
              >
                &quot;{line.key}&quot;
              </span>
              <span style={{ color: "var(--syntax-punct)" }}>: </span>
              <span
                style={{
                  color: danger
                    ? "var(--code-danger)"
                    : line.value.startsWith('"')
                      ? "var(--syntax-string)"
                      : "var(--syntax-type)",
                }}
              >
                {line.value}
              </span>
              {last ? null : (
                <span style={{ color: "var(--syntax-punct)" }}>,</span>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <Brace>{"}"}</Brace>
    </motion.div>
  );
}

function Brace({ children }: { children: string }) {
  return <div style={{ color: "var(--syntax-punct)" }}>{children}</div>;
}
