# workshop-dto

This repository builds a 60-minute, browser-only workshop that teaches DTOs and
mappers to junior developers through four sequential exercises in PHP,
TypeScript, Python, or Java.

## Authority

`docs/SPECIFICATION.md` is the product contract. Read the relevant sections
before changing workshop scope, learning content, tasks, validators, browser
state, API behavior, architecture, deployment, or acceptance tests. Apply every
affected acceptance criterion from §16. Treat the choices in §18 as unresolved;
surface them when a change depends on one.

For visual work, read `DESIGN.md` at the repo root — it is the visual language and
carries the token tables and component specs. For motion, implement only the
functional and accessibility rules in Specification §11; motion is not specified yet.

## Execution

- Route every shell command through `rtk`.
- Discover build, test, lint, and formatting commands from repository scripts and
  configuration. Document the canonical local workflow when the project is
  scaffolded.
- Preserve unrelated worktree changes. Keep each change scoped to the requested
  behavior.
- Never add a `Co-Authored-By` trailer or any other Claude/agent attribution to
  commit messages, commit bodies, or pull request descriptions.

## Invariants

- Treat participant code as inert text. Parse it locally with CodeMirror/Lezer;
  never evaluate it, send it to Symfony, or persist it on the server.
- Validate only the current learning goal. Accept formatting differences and
  semantically equivalent solutions. Return `passed` plus individual checks, and
  keep model solutions out of validator results.
- Keep business content language-neutral. The shared task definition owns the
  learning goal, inputs, expected result, checks, and explanation; track adapters
  own only filenames, syntax, starter code, editable regions, hints, solutions,
  and syntax-tree rules.
- Preserve parity across PHP, TypeScript, Python, and Java. A task-affecting
  change is complete only when every affected track produces the same business
  result.
- Unlock tasks in order. `Insert solution` fills the editor, runs validation,
  and explains the result; it is an assisted completion path, not a skip.
- Keep the application account-free and stateless on the server. Store workshop
  progress in versioned `localStorage`; use Symfony's deterministic sample
  provider instead of a database.
- Preserve the intentionally unsafe entity endpoint as teaching evidence. The
  DTO endpoint is the safe public contrast.
- Keep the frontend secret-free and restrict its browser requests to the demo
  API.
- Make the complete workshop usable with a keyboard, visible focus,
  `prefers-reduced-motion`, and the 2D no-WebGL fallback. Motion must never block
  the editor or navigation; load heavy editor and 3D modules dynamically.
- Write participant-facing UI, tasks, hints, and feedback in English. Keep
  project specification and design documentation in German.

## Change workflow

1. Trace the requested behavior to its specification sections and identify every
   affected boundary: shared task data, four track adapters, validator, browser
   state, web UI, Symfony API, deployment, and tests. This step is complete when
   every applicable boundary is accounted for.
2. Implement the smallest coherent slice while preserving the invariants above.
   Keep transformation logic explicit and testable at system boundaries.
3. Run focused checks first, then the affected package or integration suite. For
   validator changes, cover a valid solution, typical invalid solutions, and
   equivalent syntax for every affected track. For API changes, assert the exact
   entity-leak and DTO contracts. For state or UI changes, cover reload, language
   switching, sequential unlocking, reduced motion, and the 2D fallback where
   applicable.
4. Re-read the affected §16 acceptance criteria and report concrete evidence for
   each one in scope. Describe partial work as partial; workshop readiness
   requires all thirteen criteria and the repository materials listed in §15.
