# Techno Ammar — Municipality Service Management System

## Project Overview

NestJS + Prisma + PostgreSQL backend for a smart municipality platform serving citizens, employees, department managers, and administrators in Gaza. Handles service requests, task workflows, utility billing, damage assessments, complaints, and notifications with role-based access control.

## Tech Stack

- **Framework**: NestJS 11 (TypeScript)
- **ORM**: Prisma 7 with `@prisma/client` (output: `generated/prisma`)
- **Database**: PostgreSQL
- **Auth**: JWT (access + refresh tokens), Passport, bcrypt
- **Validation**: class-validator + class-transformer
- **Docs**: Swagger (@nestjs/swagger)

## Architecture: Clean / Hexagonal

```
src/
├── domain/              # Pure business logic — no framework deps
│   ├── entities/        # Plain TypeScript classes (UserEntity, etc.)
│   ├── ports/           # Interfaces for external capabilities (IHashPort, ITokenPairFactory...)
│   └── repositories/    # Repository interfaces (IUserRepository, IOtpRepository)
├── usecases/            # One file per use case, each a @Injectable() class with execute()
│   ├── auth/
│   └── users/
└── infrastructure/      # All framework & external concerns
    ├── config/          # App configuration
    ├── database/
    │   ├── prisma.module.ts / prisma.service.ts
    │   └── repositories/  # Prisma implementations of domain repository interfaces
    ├── http/
    │   ├── auth/          # Controller, DTOs, Guards, Decorators
    │   ├── users/         # Controller, DTOs
    │   └── common/        # Response interceptor, exception filter, shared DTOs
    ├── modules/           # NestJS module wiring (app.module, auth.module, users.module)
    └── security/          # Adapters: bcrypt, JWT variants, OTP, token-pair factory
```

**Key rule**: Domain layer has zero NestJS/Prisma imports. Use cases inject ports/repos by interface token.

## Path Aliases (tsconfig.json)

```
@/          → src/
@domain/    → src/domain/
@usecases/  → src/usecases/
@infrastructure/ → src/infrastructure/
@/generated/ → generated/   (Prisma client)
```

## Database

Schema: [prisma/schema.prisma](prisma/schema.prisma)  
Prisma client output: `generated/prisma/`

**Current models**: `User`, `OtpCode`  
Enums: `UserRole` (ADMIN, CITIZEN, EMPLOYEE, DEPARTMENT_MANAGER), `GazaCities`, `OtpType`

**DB scripts**:
```bash
npm run db:migrate:dev   # migrate with .env.dev
npm run db:push:dev      # push schema without migration
npm run db:seed:dev      # run seed
```

### Planned Schema (database.txt — DBML format, needs refinement)
The `database.txt` file contains a broader DBML design. Key tables to implement (priority order):
1. `department`, `section` — org structure
2. `service_flow`, `flow_step`, `service` — service catalog
3. `service_request`, `task_instance` — core workflow
4. `asset` — file uploads
5. `payment` — service fees
6. `notification`
7. `complaint`, `damage_assessment`, `utility_account`, `utility_fee` (lower priority)

## Development Priority — Module Order

Work module by module in this sequence:

| Priority | Module | Status |
|----------|--------|--------|
| 1 | Auth & User Management | **Done (base)** — login, signup, JWT, OTP, RBAC guards |
| 2 | Organizational Structure | Not started — departments, sections, employee assignment |
| 3 | Citizen Profile | Not started |
| 4 | Services Catalog | Not started — service_flow, flow_step, service |
| 5 | Service Requests & Tasks | Not started — core workflow engine |
| 6 | Notifications | Not started |
| 7 | Payments (service fees) | Lower priority |
| 8 | Utility Billing | Lower priority |
| 9 | Complaints & Damage | Lower priority |
| 10 | Analytics Dashboard | Lower priority |
| 11 | System Logs & Audit | Lower priority |

## Naming & Conventions

- **Files**: kebab-case (e.g. `create-department.use-case.ts`)
- **Classes**: PascalCase
- **DB columns**: snake_case (Prisma maps with `@@map`)
- **Enums** in Prisma: PascalCase names, stored as strings
- **DTOs**: class-validator decorators, never expose `password_hash`
- **Tests**: `__tests__/` subfolder alongside the file under test, `*.spec.ts`

## Auth Flow

- Login accepts `national_id` OR `employee_id` as `identifier` field
- Returns `access_token` + `refresh_token` pair
- Guards: `JwtAuthGuard` (default), `RolesGuard` + `@Roles()` decorator
- Active user injected via `@ActiveUser()` decorator

## Key Files

- [src/infrastructure/modules/app.module.ts](src/infrastructure/modules/app.module.ts) — root module wiring
- [src/infrastructure/http/common/interceptors/response.interceptor.ts](src/infrastructure/http/common/interceptors/response.interceptor.ts) — standard API response wrapper
- [src/infrastructure/http/common/filters/exception.filter.ts](src/infrastructure/http/common/filters/exception.filter.ts) — global error handler
- [prisma/schema.prisma](prisma/schema.prisma) — database schema source of truth

## Environment

- Dev: `.env.dev` (used via `dotenv-cli`)
- Prod: `.env`
- Docker: `docker-compose.yaml` (PostgreSQL)

## Running the Project

```bash
npm run start:dev        # dev with watch
npm run start            # dev without watch
npm run test             # unit tests
npm run lint             # eslint fix
```

## SRS Reference

Full SRS: [TECHNO_AMMAR_MODULES.md](TECHNO_AMMAR_MODULES.md) — 12 modules, each with data model, functional requirements, use cases, and API endpoints.

When implementing a module, reference the corresponding section in TECHNO_AMMAR_MODULES.md for:
- Exact entity fields and enums
- Use case IDs (UC-*)
- API endpoint shapes
- Status state machines
- Dependencies on other modules
