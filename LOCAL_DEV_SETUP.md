# Local Development with Deployed Auth

This guide explains how to run the AML Next.js frontend locally while using the **deployed** auth service (`auth.janovix.workers.dev`). This is ideal for pure frontend development where you don't need to modify authentication logic.

## How It Works

The deployed auth service (`auth-svc.janovix.workers.dev`) sets cookies with domain `.janovix.workers.dev`. When you access the local frontend via `aml-local.janovix.workers.dev` (through Caddy), the browser recognizes this as a subdomain of `.janovix.workers.dev` and sends the auth cookies automatically.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Browser                                                                     │
│                                                                             │
│  aml-local.janovix.workers.dev (Caddy → localhost:3000)                     │
│         ↓                                                                   │
│  Cookie domain: .janovix.workers.dev ✓ matches!                             │
│         ↓                                                                   │
│  Session cookie sent → JWT obtained → API calls work                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- Node.js 18+
- pnpm
- [Caddy](https://caddyserver.com/docs/install) installed globally

## Setup Steps

### 1. Update Your Hosts File

Add the entries from `hosts.local` in the repo root to your system hosts file:

**Windows** (`C:\Windows\System32\drivers\etc\hosts`):

```
127.0.0.1 aml-local.janovix.workers.dev
127.0.0.1 aml-svc-local.janovix.workers.dev
127.0.0.1 auth-local.janovix.workers.dev
127.0.0.1 auth-svc-local.janovix.workers.dev
```

**macOS/Linux** (`/etc/hosts`) - requires `sudo`:

```bash
sudo sh -c 'cat hosts.local >> /etc/hosts'
```

### 2. Trust Caddy's Internal CA

Caddy generates self-signed certificates for local HTTPS. You need to trust its CA certificate.

**Windows (PowerShell as Administrator):**

```powershell
caddy trust
```

**macOS:**

```bash
caddy trust
```

**Linux (varies by distro):**

```bash
caddy trust
# Or manually add ~/.local/share/caddy/pki/authorities/local/root.crt to your system trust store
```

**Firefox Users:** Firefox uses its own certificate store:

1. Go to `about:preferences#privacy`
2. Click "View Certificates"
3. Under "Authorities", import Caddy's root CA from:
   - Windows: `%APPDATA%\Caddy\pki\authorities\local\root.crt`
   - macOS/Linux: `~/.local/share/caddy/pki/authorities/local/root.crt`

### 3. Create Environment Configuration

Create a `.env.local` file in the `aml` directory:

```env
# Auth Configuration (DEPLOYED dev environment)
NEXT_PUBLIC_AUTH_APP_URL=https://auth.janovix.workers.dev
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-svc.janovix.workers.dev

# AML Backend API (choose one)
# Option A: Use deployed backend (no local backend needed)
NEXT_PUBLIC_AML_CORE_URL=https://aml-svc.janovix.workers.dev

# Option B: Use local backend (if running aml-svc locally)
# NEXT_PUBLIC_AML_CORE_URL=https://aml-svc-local.janovix.workers.dev
```

### 4. Start Caddy

From the repository root:

```bash
caddy run --config Caddyfile
```

Or to run in background:

```bash
caddy start --config Caddyfile
```

### 5. Start the Development Server

```bash
cd aml
pnpm install
pnpm dev
```

### 6. Access the Application

Open **https://aml-local.janovix.workers.dev** in your browser.

You'll be redirected to `auth.janovix.workers.dev` for login. After authentication, you'll be redirected back to your local frontend with a valid session.

## Configuration Options

### Using Deployed Backend (Default)

This is the simplest setup for frontend development:

```env
NEXT_PUBLIC_AML_CORE_URL=https://aml-svc.janovix.workers.dev
```

No need to run `aml-svc` locally. All API calls go to the deployed dev backend.

### Using Local Backend

If you need to develop backend features simultaneously:

1. Create `aml-svc/wrangler.local.jsonc`:

   ```jsonc
   {
   	"$schema": "node_modules/wrangler/config-schema.json",
   	"compatibility_date": "2025-10-08",
   	"main": "src/index.ts",
   	"name": "aml-svc-local",
   	"d1_databases": [
   		{
   			"binding": "DB",
   			"database_name": "aml-local",
   			"database_id": "local-dev-db",
   		},
   	],
   	"vars": {
   		"ENVIRONMENT": "local",
   		"AUTH_SERVICE_URL": "https://auth-svc.janovix.workers.dev",
   	},
   }
   ```

2. Run aml-svc:

   ```bash
   cd aml-svc
   pnpm run seedLocalDb
   wrangler dev --config wrangler.local.jsonc --port 8789
   ```

3. Update your `.env.local`:
   ```env
   NEXT_PUBLIC_AML_CORE_URL=https://aml-svc-local.janovix.workers.dev
   ```

## Troubleshooting

### "Your connection is not private" / SSL Error

The Caddy CA certificate is not trusted. Run `caddy trust` (may require admin privileges).

### Redirect Loop After Login

1. Clear cookies for `*.janovix.workers.dev`
2. Ensure the hosts file entries are correct
3. Check that Caddy is running

### Session Cookie Not Sent

Verify the domain in browser DevTools → Application → Cookies:

- Cookie domain should be `.janovix.workers.dev`
- Your request URL should match (e.g., `aml-local.janovix.workers.dev`)

### CORS Errors

The deployed `auth-svc` trusts `https://*.janovix.workers.dev` origins, which includes `aml-local.janovix.workers.dev`. If you see CORS errors:

1. Ensure you're accessing via `https://aml-local.janovix.workers.dev`, not `localhost`
2. Check the browser console for the exact error message

### API 401 Unauthorized

1. Verify you're logged in (check cookies)
2. JWT token might be expired - refresh the page
3. Check that `NEXT_PUBLIC_AUTH_SERVICE_URL` is correct

## Development Workflow

### Frontend Only

```bash
# Terminal 1: Start Caddy
caddy run --config Caddyfile

# Terminal 2: Start Next.js dev server
cd aml && pnpm dev
```

Access: https://aml-local.janovix.workers.dev

### Full Stack (Local Backend)

```bash
# Terminal 1: Start Caddy
caddy run --config Caddyfile

# Terminal 2: Start aml-svc
cd aml-svc && pnpm dev

# Terminal 3: Start Next.js dev server
cd aml && pnpm dev
```

Make sure your `.env.local` points to the local backend.

## Architecture Reference

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DEPLOYED (Dev Environment)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   auth.janovix.workers.dev          auth-svc.janovix.workers.dev            │
│   ┌───────────────────────┐         ┌───────────────────────────┐           │
│   │   Auth Frontend       │ ◄─────► │   Auth Backend (Better    │           │
│   │   (Next.js)           │         │   Auth + JWT Plugin)      │           │
│   └───────────────────────┘         └───────────────────────────┘           │
│           │                                    │                             │
│           │ Sets cookies:                      │ Issues JWTs                 │
│           │ .janovix.workers.dev               │ Provides JWKS               │
│           ▼                                    ▼                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                              LOCAL (Your Machine)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   aml-local.janovix.workers.dev     aml-svc-local.janovix.workers.dev       │
│   ┌───────────────────────┐         ┌───────────────────────────┐           │
│   │   Caddy → Next.js     │ ──JWT─► │   Caddy → aml-svc         │           │
│   │   localhost:3000      │         │   localhost:8789          │           │
│   └───────────────────────┘         └───────────────────────────┘           │
│           │                                    │                             │
│           │ Cookie domain matches:             │ Verifies JWT via            │
│           │ .janovix.workers.dev ✓             │ deployed JWKS               │
│           │                                    ▼                             │
│           └──────────────────────────────────────────────────────►          │
│                                                                              │
│            OR: Use deployed aml-svc.janovix.workers.dev directly             │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Environment Variable Reference

| Variable                       | Description       | Example                                |
| ------------------------------ | ----------------- | -------------------------------------- |
| `NEXT_PUBLIC_AUTH_APP_URL`     | Auth frontend URL | `https://auth.janovix.workers.dev`     |
| `NEXT_PUBLIC_AUTH_SERVICE_URL` | Auth backend URL  | `https://auth-svc.janovix.workers.dev` |
| `NEXT_PUBLIC_AML_CORE_URL`     | AML backend URL   | `https://aml-svc.janovix.workers.dev`  |
