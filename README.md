# DTO & Mapper Workshop

A 60-minute, browser-only workshop for junior developers. Participants learn
DTOs and mappers through four sequential exercises in PHP, TypeScript, Python,
or Java.

## Project documents

- [Workshop specification](docs/SPECIFICATION.md)
- [Assessment rubric](Bewertungsraster_Barcamp_DP.docx)

## Monorepo layout

```text
apps/
├── web/   # Next.js (TypeScript, static export)
└── api/   # Symfony demo API (PHP 8.3)
```

## Prerequisites

- [Node.js 22+](https://nodejs.org/) with [pnpm](https://pnpm.io/) (enable via
  `corepack enable`)
- [Docker](https://www.docker.com/) and Docker Compose, to run the Symfony API
  without installing PHP locally

No database is required.

## Local development

Install JavaScript dependencies once, from the repository root:

```bash
corepack enable
pnpm install
```

Start both applications with one command:

```bash
pnpm dev
```

This runs the Symfony API in Docker (`docker compose up --build api`) on
[http://localhost:8000](http://localhost:8000) and the Next.js dev server
(`pnpm --filter web dev`) on [http://localhost:3000](http://localhost:3000).
The web app reads the API base URL from `NEXT_PUBLIC_API_URL`, defaulting to
`http://localhost:8000` for local development.

Health check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
should return `{"status":"ok"}`, and the same status is shown on the Next.js
landing page.

To run either app on its own:

```bash
pnpm dev:api   # Symfony API only, via Docker
pnpm dev:web   # Next.js only
```

### Quality checks

```bash
# Web (apps/web)
pnpm run format:check:web
pnpm run lint:web
pnpm run typecheck:web
pnpm run test:web
pnpm run build:web

# API (apps/api) — run inside the apps/api directory with PHP 8.3 available,
# e.g. via `docker run --rm -v "$PWD":/app -w /app php:8.3-cli php <command>`
composer install
composer run cs-check   # formatting
composer run phpstan    # static analysis
composer run test       # PHPUnit
```

The same checks run in CI on every push and pull request (see
[.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Deployment

[render.yaml](render.yaml) defines a [Render Blueprint](https://render.com/docs/blueprints)
with two services: the Next.js app as a static site, and the Symfony API as a
Docker web service. Connect the repository in the Render dashboard via
"New > Blueprint" to deploy both from `main`.
