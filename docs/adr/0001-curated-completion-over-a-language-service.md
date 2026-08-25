# Curated Completion over a language service

## Status

accepted

## Context

Participants compare the workshop editor to VS Code and expect its Completion. Real
type-aware IntelliSense is reachable for exactly one of the four tracks: TypeScript's
compiler runs in a browser worker, while PHP, Python and Java would need either a
language server behind the Demo API — which must never receive Participant code — or
multi-megabyte WASM builds.

## Decision

All four tracks get the same hand-curated Completion source: the task's input symbols
spelled in the track's syntax, plus a short list of that track's built-ins. No track
gets a language service, TypeScript included, and the editor stays on CodeMirror 6.

## Considered Options

- **Monaco.** Its one advantage over CodeMirror is the bundled TypeScript service, which
  this decision rejects anyway. Adopting it would mean rewriting the restricted-editing
  region, the theme, and — because the validators read Lezer syntax trees Monaco does
  not produce — all sixteen track validators.
- **TypeScript-only IntelliSense.** Rejected on the equivalence invariant: a Participant
  picks a track on the first screen with no way to know one of them is the good one.
  Typechecking in a worker would not have violated "Participant code is never executed",
  so the objection is pedagogical, not technical.

## Consequences

Completion deliberately offers the task's *inputs* and never the target DTO's members.
Offering the target would answer the task outright and make both the third Hint card and
the check pointless — so a future "make Completion smarter" change has to preserve that
asymmetry, not just widen the symbol list.
