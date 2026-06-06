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

## Architecture: Modular Clean / Hexagonal

```
src/
├── main.ts
├── app.module.ts
├── shared/
│   ├── common/          # Interceptors, filters, shared utils/DTOs
│   ├── database/        # PrismaModule, PrismaService
│   └── config/          # App configuration
└── modules/
    ├── auth/
    │   ├── domain/      # OTP entity, token/hash/otp ports, otp repo interface
    │   ├── application/ # Login, signup, refresh, password reset use cases
    │   ├── infrastructure/ # JWT/bcrypt/OTP adapters, Prisma OTP repo
    │   ├── presentation/   # Controller, DTOs, guards, decorators
    │   └── auth.module.ts
    ├── users/
    ├── org/
    ├── citizens/
    └── employees/
```

Each feature module owns its domain layer. Cross-module access goes through exported repository interfaces and NestJS module imports.

**Key rule**: Domain layer has zero NestJS/Prisma imports. Application use cases inject ports/repos by interface token.

## Path Aliases (tsconfig.json)

```
@/          → src/
@shared/    → src/shared/
@auth/      → src/modules/auth/
@users/     → src/modules/users/
@org/       → src/modules/org/
@citizens/  → src/modules/citizens/
@employees/ → src/modules/employees/
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
| 2 | Organizational Structure | **Done** — departments, sections |
| 3 | Citizen Profile | **Done** — profile, verification, admin review |
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

- [src/app.module.ts](src/app.module.ts) — root module wiring
- [src/shared/common/interceptors/response.interceptor.ts](src/shared/common/interceptors/response.interceptor.ts) — standard API response wrapper
- [src/shared/common/filters/exception.filter.ts](src/shared/common/filters/exception.filter.ts) — global error handler
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
