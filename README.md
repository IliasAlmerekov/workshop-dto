# DTO & Mapper Workshop

A browser-only workshop for junior developers that explains DTOs and explicit
mappers through one six-step Registration Migration story. Participants choose
PHP, TypeScript, Python, or Java; the business outcome is the same in every
track, while syntax, starter code, hints, and validators match the language.

No participant code is executed or sent to the server. Editing and validation
happen locally in the browser.

## The registration migration

The workshop replaces a legacy registration flow. A `legacyProfile` from the
old Registration API becomes a new account, a prepared welcome email, and a
safe result for the Registration Complete screen.

1. Define the immutable `CreateUserRequest` contract.
2. Map and normalize `legacyProfile` into `CreateUserRequest`.
3. Define the immutable `WelcomeEmail` contract.
4. Map a created `User` into `WelcomeEmail` without sending it.
5. Define the immutable public `RegistrationResponse` contract.
6. Map a created `User` into `RegistrationResponse`, excluding private fields.

Tasks unlock in order. Progressive hints culminate in **Insert solution**,
which fills the editor, validates the result, and explains why it works.
Progress is stored in versioned browser `localStorage`; the server is
account-free and stateless.

## Demo API

The Symfony demo API serves deterministic sample data and deliberately exposes
two contrasting endpoints: an unsafe entity response and a safe DTO response.
It never receives participant code or stores workshop progress.

## Repository

- `apps/web` — Next.js workshop UI, CodeMirror exercises, local validators,
  accessibility support, and the 2D no-WebGL fallback.
- `apps/api` — Symfony demo API with deterministic sample data.
- `apps/deck` — workshop presentation deck.
- `docs/SPECIFICATION.md` — product and learning contract.
- `docs/DESIGN.md` — visual language and component guidance.
- `render.yaml` — Render deployment blueprint.

## Run locally

Requirements: Node.js 22+, pnpm, Docker, and Docker Compose. No database or
local PHP installation is required.

```bash
corepack enable
pnpm install
pnpm dev
```

Open [the workshop](http://localhost:3000). The Symfony API is available at
[http://localhost:8000](http://localhost:8000), with its health check at
[http://localhost:8000/api/health](http://localhost:8000/api/health).

## Verify changes

```bash
pnpm format:check:web
pnpm typecheck:web
pnpm test:web
pnpm build:web
```

## Documentation

- [Workshop specification](docs/SPECIFICATION.md)
- [Design language](docs/DESIGN.md)
- [Accessibility notes](docs/ACCESSIBILITY.md)
- [Render deployment blueprint](render.yaml)
