# DTO & Mapper Workshop

A browser-only, 60-minute workshop for junior developers. It teaches how DTOs
and explicit mappers protect application boundaries through four guided
exercises in PHP, TypeScript, Python, or Java.

## What participants do

Participants follow one User Registration story:

1. define an immutable request DTO;
2. map and normalize incoming data;
3. isolate an external API contract;
4. map an internal entity to a safe public response.

The workshop compares an intentionally unsafe entity endpoint with a DTO-based
response. Code is edited and validated locally in the browser; it is never run
or sent to the API.

## Repository

- `apps/web` — Next.js workshop interface with CodeMirror exercises.
- `apps/api` — Symfony demo API with deterministic sample data.
- `docs/SPECIFICATION.md` — product and learning contract.
- `render.yaml` — deployment blueprint for the web app and demo API.

## Run locally

Requires Node.js 22+, pnpm, Docker, and Docker Compose. No database or local
PHP installation is needed.

```bash
corepack enable
pnpm install
pnpm dev
```

Open [the workshop](http://localhost:3000). The Symfony demo API runs at
[http://localhost:8000](http://localhost:8000); its health check is available
at [http://localhost:8000/api/health](http://localhost:8000/api/health).

## Documentation

- [Workshop specification](docs/SPECIFICATION.md)
- [Render deployment blueprint](render.yaml)
