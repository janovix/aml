# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Next.js 16 frontend for the Janovix AML (Anti-Money Laundering) platform, deployed on Cloudflare Workers. All backend services (`auth-svc`, `aml-svc`, etc.) are remote—no local backends to run.

### Running the dev server

The app requires **Caddy** as a reverse proxy for cookie domain matching (`*.janovix.workers.dev`). Setup:

1. Install Caddy: `sudo apt-get install -y caddy` (or via Cloudsmith repo)
2. Give Caddy port binding: `sudo setcap 'cap_net_bind_service=+ep' $(which caddy)`
3. Add hosts entries: `sudo sh -c 'echo "127.0.0.1 aml-local.janovix.workers.dev" >> /etc/hosts'`
4. Start Caddy: `caddy start --config Caddyfile` (from repo root)
5. Start Next.js: `NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm dev` (or `pnpm dev:local`)
6. Access via `https://aml-local.janovix.workers.dev`

The app redirects unauthenticated users to `auth.janovix.workers.dev`. An active session cookie (`.janovix.workers.dev` domain) is required to access the dashboard.

### Quality gates (see `package.json` scripts)

- `pnpm lint` — ESLint (zero warnings enforced)
- `pnpm typecheck` — TypeScript strict check
- `pnpm test` — Vitest with Istanbul coverage
- `pnpm format:check` — Prettier

Pre-commit hooks run `lint-staged` + `typecheck` + `test`. Commit messages must follow Conventional Commits (enforced by commitlint).

### API documentation

The `aml-svc` OpenAPI docs are at `https://aml-svc.janovix.workers.dev/docsz` (note: `/docsz` not `/docs`). The raw spec is at `/openapi.json`.

