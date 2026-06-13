# Techno Ammar — Smart Municipality System

NestJS + Prisma + PostgreSQL backend for a Gaza municipality service management platform.

## Stack

- **NestJS 11** (TypeScript)
- **Prisma 7** + PostgreSQL
- **JWT** (access + refresh tokens), bcrypt, OTP
- **Swagger** for API docs

## Architecture

Clean/Hexagonal architecture:

```
src/
├── domain/          # Entities, port interfaces, repository interfaces (no framework deps)
├── usecases/        # One use case class per operation (execute() method)
└── infrastructure/  # NestJS modules, controllers, DTOs, Prisma repos, JWT adapters
```

## Getting Started

```bash
# Install dependencies
npm install

# Start PostgreSQL
docker compose up -d

# Run dev migrations
npm run db:migrate:dev

# Start dev server (watch mode)
npm run start:dev
```

API docs available at `http://localhost:3000/api` (Swagger).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Dev server with hot reload |
| `npm run build` | Build for production |
| `npm run test` | Unit tests |
| `npm run lint` | ESLint fix |
| `npm run db:migrate:dev` | Run Prisma migrations (dev) |
| `npm run db:push:dev` | Push schema without migration |
| `npm run db:seed:dev` | Run seed file |

## Environment

- `.env.dev` — development database URL
- `.env` — production database URL

## Modules

| Module | Status |
|--------|--------|
| Auth & User Management | Done |
| Organizational Structure | Planned |
| Citizen Profile | Planned |
| Services Catalog | Planned |
| Service Requests & Tasks | Planned |
| Notifications | Planned |
| Payments, Billing, Complaints | Lower priority |

See [TECHNO_AMMAR_MODULES.md](TECHNO_AMMAR_MODULES.md) for full module specs.  
See [CLAUDE.md](CLAUDE.md) for development conventions and architecture guide.
