# workshop-dto

A 60-minute browser lab teaching DTOs and mappers to junior developers. Participants pick one of four
language **tracks** (PHP, TypeScript, Python, Java) and solve four sequential **tasks** in a CodeMirror
editor. A real Symfony demo API supplies the before/after responses.

`docs/SPECIFICATION.md` (German) is the authority on product scope, task content, the User-Registration
story, the monorepo layout, and acceptance criteria. Read it before writing task content, validators,
API endpoints, storage keys, or the Render/Compose setup — it settles most design questions this file
only summarises. `DESIGN.md` at the repo root is the visual language — colour, type, spacing, radius,
elevation and every component spec, measured from `reference/*.png` and mirrored by the Figma file
`HAuazsHk1Uw3NPQoOdJmSW`. `tokens.json` and `theme.css` are generated views of the same set; change
all three together.

## Invariants

These hold across every change; breaking one breaks the workshop's premise.

- **Participant code is never executed** — not in the browser, not in Symfony, not anywhere. Validation
  reads the Lezer syntax tree from CodeMirror and checks declarative rules. This is why the project
  needs no sandbox; keep it that way.
- **Validators check the learning goal only.** Formatting, whitespace, and semantically equivalent
  expressions all pass. A validator returns `{passed, checks[]}` and never leaks the model solution.
- **Tracks are equivalent.** One language-neutral task definition owns the learning goal, input data,
  expected result, and business checks. Track adapters add only syntax: filename, starter code,
  editable regions, hints, model solution, AST rules. A new track inherits the business rules.
- **Tasks unlock in order.** Task N+1 opens once task N passes all its checks. `Insert solution` is the
  escape hatch: it fills the code, runs validation, and explains why the solution works.
- **No accounts, no server state, no database.** Progress lives in `localStorage` behind a versioned
  schema key; the Symfony API answers from a deterministic `UserSampleProvider`.
- **The entity endpoint leaks on purpose.** `GET /api/demo/users/7/entity` serialises the internal
  entity — internal fields, unstable date format, and all. Treat it as teaching material, not a bug.
- **Accessibility and fallback are load-bearing.** The full workshop completes under
  `prefers-reduced-motion` and with the 2D fallback (no WebGL). Animation never blocks the editor or
  navigation; keyboard operation and visible focus work throughout.
- **The frontend holds no secrets** and talks only to the demo API.

## Conventions

- Participant-facing text (UI, tasks, hints, feedback) is English. `docs/` is German.
- Feedback names the violated business rule (`birthDate` is still text, not a date type) without
  handing over the solution.
- Heavy editor and 3D modules load dynamically.

## Build and run

Nothing is scaffolded yet — no `apps/`, no `package.json`, no `docker-compose.yml`. When you add the
first commands, record them here.

## Git

Never add a `Co-Authored-By` trailer or any other Claude/agent attribution to commit messages,
commit bodies, or pull request descriptions.

Write pull request descriptions in two or three sentences: what changed and why. The commit
history carries the detail.
