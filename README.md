# Janovix AML Platform

A comprehensive Anti-Money Laundering (AML) management platform built with Next.js and deployed on Cloudflare Workers.

## Features

- **Multi-tenant Organization Support**: Full multi-organization architecture with URL-based routing (`/[orgSlug]/...`)
- **Client Management**: Track and manage clients with detailed profiles, documents, and addresses
- **Transaction Monitoring**: Monitor and analyze financial transactions for suspicious activity
- **Alert System**: Automated alert generation and manual review workflows
- **Report Generation**: Generate regulatory compliance reports
- **Team Management**: Invite and manage team members with role-based access control
- **Shareable URLs**: Organization context and table filters are persisted in the URL for easy sharing

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Deployment**: [Cloudflare Workers](https://workers.cloudflare.com/) via [OpenNext](https://opennext.js.org/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with persistence
- **Authentication**: [better-auth](https://www.better-auth.com/) integration with `auth-svc`
- **API Client**: Custom fetch utilities with JWT injection

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (preferred) or npm

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Local Development with Deployed Auth

For frontend development using the deployed auth service (recommended for most use cases), see **[LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md)**.

This setup allows you to:

- Run the Next.js frontend locally via `https://aml-local.janovix.workers.dev`
- Use deployed auth at `auth.janovix.workers.dev` (no local auth setup needed)
- Optionally use deployed or local `aml-svc` backend

### Environment Variables

Create a `.env.local` file with:

```env
# Auth Configuration (deployed dev environment)
NEXT_PUBLIC_AUTH_APP_URL=https://auth.janovix.workers.dev
NEXT_PUBLIC_AUTH_SERVICE_URL=https://auth-svc.janovix.workers.dev

# AML Backend API
NEXT_PUBLIC_AML_CORE_URL=https://aml-svc.janovix.workers.dev
```

See [LOCAL_DEV_SETUP.md](./LOCAL_DEV_SETUP.md) for full configuration options.

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   └── [orgSlug]/          # Organization-scoped routes
│       ├── clients/        # Client management pages
│       ├── transactions/   # Transaction pages
│       ├── alerts/         # Alert management
│       ├── reports/        # Report generation
│       ├── team/           # Team management
│       └── settings/       # Organization settings
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── layout/             # Layout components (sidebar, navbar)
│   ├── clients/            # Client-related components
│   ├── transactions/       # Transaction components
│   ├── alerts/             # Alert components
│   ├── reports/            # Report components
│   ├── data-table/         # Generic data table with filters
│   └── org/                # Organization management
├── hooks/                  # Custom React hooks
├── lib/
│   ├── api/                # API client utilities
│   ├── auth/               # Authentication utilities
│   └── org-store.ts        # Organization state management
└── types/                  # TypeScript type definitions
```

## URL-Based Organization Routing

The application uses URL-based organization routing for shareable URLs:

- URLs follow the pattern: `/{orgSlug}/{page}`
- Example: `/acme-corp/clients`, `/acme-corp/transactions`
- When a URL with an org slug is shared, the recipient will switch to that organization (if they have access)
- If access is denied, a forbidden page is displayed

## URL Filter Persistence

Table filters and search queries are persisted in the URL:

- Filters: `?f.status=active&f.type=individual`
- Search: `?q=search-term`
- Sort: `?sort=createdAt&dir=desc`

This allows sharing filtered views with teammates.

## Scripts

| Command                   | Description                      |
| ------------------------- | -------------------------------- |
| `pnpm dev`                | Start development server         |
| `pnpm build`              | Build for production             |
| `pnpm preview`            | Preview production build locally |
| `pnpm deploy`             | Deploy to Cloudflare Workers     |
| `pnpm test`               | Run tests with coverage          |
| `pnpm lint`               | Run ESLint                       |
| `pnpm typecheck`          | Run TypeScript type checking     |
| `pnpm prettier --check .` | Check code formatting            |

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/components/OrgBootstrapper.test.tsx
```

Coverage thresholds are enforced at 80% for statements, branches, functions, and lines.

## Deployment

Build and deploy to Cloudflare Workers:

```bash
pnpm build && pnpm deploy
```

View real-time logs:

```bash
pnpm wrangler tail
```

## Related Services

- **auth-svc**: Authentication service handling user sessions and JWT tokens
- **aml-svc**: Backend API for AML data (clients, transactions, alerts, reports)
- **import-svc**: Service for bulk data imports

## License

Proprietary - Janovix
