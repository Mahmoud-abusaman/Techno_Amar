# Techno Ammar — Session Handoff

> Drop this file into the next Claude Code session along with CLAUDE.md.
> Between the two files, Claude will have full context to continue without repeating questions.

---

## Project in One Line

NestJS 11 + Prisma 7 + PostgreSQL backend for a Gaza municipality platform.
Clean/Hexagonal architecture: `domain` (no framework) → `usecases` → `infrastructure` (NestJS, Prisma, HTTP).

---

## What Was Done This Session

### Setup
- Created `CLAUDE.md` — project context file for Claude Code (architecture, path aliases, DB scripts, conventions, module priority).
- Rewrote `README.md` with real project documentation.
- Created persistent memory files under `~/.claude/projects/.../memory/`.

### Module 3 — Organizational Structure ✅
**Prisma models added:** `Department`, `Section`  
**Domain:** `DepartmentEntity`, `SectionEntity`, `IDepartmentRepository`, `ISectionRepository`  
**Use cases (10):** full CRUD for departments and sections with manager ownership checks  
**HTTP:** `DepartmentsController` (`/departments`), `SectionsController` (`/sections/departments/:deptId`)  
**Module:** `OrgModule` wired into `AppModule`  
**Tests:** 40 tests across 7 spec files

Key design decision: manager can only manage sections inside their own department. The manager's `department_id` is encoded in the JWT access token payload and passed as context to use cases — no extra DB call per request.

### Module 2 — Citizens & Employees ✅
**Prisma models/enums added:** `AccountStatus` enum (`PENDING_VERIFICATION | ACTIVE | INACTIVE | REJECTED`), `CitizenProfile` table, `account_status` field on `User`  
**Domain:** `CitizenProfileEntity`, `ICitizenProfileRepository`, `FindUsersFilter` on `IUserRepository`  

**Citizen use cases (7):**
- `GetCitizenProfileUseCase` — returns user + profile
- `UpdateCitizenProfileUseCase` — updates user fields + date_of_birth on profile
- `UploadVerificationDocumentUseCase` — stores disk path to profile
- `ListCitizensUseCase` — filtered `findAll({ role: CITIZEN })`
- `VerifyCitizenUseCase` — requires uploaded doc, sets `ACTIVE + is_verified=true`
- `RejectCitizenUseCase` — records reason, sets `REJECTED`
- `DeactivateCitizenUseCase` — sets `INACTIVE + is_active=false`

**Employee use cases (5):**
- `CreateEmployeeUseCase` — hashes password, derives `department_id` from `section_id`, manager restricted to own dept
- `ListEmployeesUseCase` — manager sees only own dept; admin sees all; supports filter by dept/section/is_active
- `GetEmployeeUseCase` — manager restricted to own dept
- `UpdateEmployeeUseCase` — manager can't change roles; section change re-derives department
- `DeactivateEmployeeUseCase` — manager restricted to own dept

**HTTP:**
- `CitizensController` — routes: `GET/PUT /citizens/me`, `POST /citizens/me/verification-document` (multipart, max 5MB, jpg/png/pdf, stored to `uploads/verification-docs/`), `GET/POST /admin/citizens`, `POST /admin/citizens/:id/verify|reject|deactivate`
- `EmployeesController` — routes: `POST/GET /employees`, `GET/PATCH/POST /employees/:id`, `POST /employees/:id/deactivate`

**Modules:** `CitizensModule`, `EmployeesModule` wired into `AppModule`  
**Tests:** 33 tests across 6 spec files  
**Fix applied:** installed `@types/multer` for `Express.Multer.File` type support

---

## Current State

### Test suite
```
Test Suites: 23 passed, 23 total
Tests:       155 passed, 155 total
```

### Modules status

| # | Module | Status |
|---|--------|--------|
| 1 | Auth & User Management | ✅ Done |
| 2 | Citizens & Employees | ✅ Done |
| 3 | Organizational Structure | ✅ Done |
| 4 | Services Catalog | ⬜ Not started |
| 5 | Service Requests & Tasks | ⬜ Not started |
| 6 | Notifications | ⬜ Not started |
| 7 | Payments | ⬜ Low priority |
| 8 | Utility Billing | ⬜ Low priority |
| 9 | Complaints & Damage | ⬜ Low priority |

### Key files
- [prisma/schema.prisma](prisma/schema.prisma) — source of truth for DB schema
- [src/infrastructure/modules/app.module.ts](src/infrastructure/modules/app.module.ts) — root NestJS wiring
- [src/domain/](src/domain/) — entities, repository interfaces, port interfaces (zero NestJS imports)
- [TECHNO_AMMAR_MODULES.md](TECHNO_AMMAR_MODULES.md) — full SRS per module (use cases, endpoints, data models)
- [database.txt](database.txt) — DBML design (broader, needs refinement — use as reference, not gospel)

---

## Architecture Rules (Critical)

1. **Domain layer = zero NestJS/Prisma imports.** Entities are plain TS classes. Repositories and ports are plain interfaces with Symbol tokens.
2. **Use cases** are `@Injectable()` classes with a single `execute()` method. They inject ports/repos by Symbol token via `@Inject(TOKEN)`.
3. **Authorization context** (actorRole, actorDepartmentId) is passed as a plain object to use cases from the controller — never inject the HTTP request into use cases.
4. **`department_id` is encoded in the JWT** access token payload as a `string | null`. Controllers read it via `@ActiveUser()` and convert with `BigInt()` before passing to use case context.
5. **Prisma enums** (UserRole, AccountStatus, etc.) are `const` objects + string union types — you cannot use `UserRole.EMPLOYEE` as a type. Use the string literal `'EMPLOYEE'` or the union type `UserRole`.
6. **After any `prisma/schema.prisma` change**, run both:
   ```bash
   npm run db:push:dev         # sync DB
   npx dotenv-cli -e .env.dev -- npx prisma generate   # regenerate TS client
   ```
   `db:push` alone does NOT regenerate the client.
7. **`@usecases/*` path alias** exists in both `tsconfig.json` and `package.json` Jest config — keep them in sync.

---

## Next Module to Implement: Module 4 — Services Catalog

Reference: `TECHNO_AMMAR_MODULES.md` § MODULE 4.

**What it covers:**
- `MunicipalityService` entity: name, description, `department_id` (FK), fee, `estimated_processing_days`, `status` (DRAFT | PUBLISHED | ARCHIVED)
- `RequiredDocument` entity: per-service list of docs (MANDATORY | OPTIONAL)
- `ServiceWorkflowTask` entity: ordered steps per service, each pointing to a department + section + estimated hours

**Key business rules:**
- Service is created as DRAFT, only becomes visible to citizens when PUBLISHED
- Must have at least one workflow task before it can be published
- Admin-only for create/update/delete/publish
- Citizens can browse PUBLISHED services (read-only)
- Service cannot be deleted if active service requests exist (check Module 5 when built)

**Expected Prisma additions:**
```prisma
enum ServiceStatus { DRAFT PUBLISHED ARCHIVED }
enum DocumentType  { MANDATORY OPTIONAL }

model MunicipalityService { ... department: Department ... }
model RequiredDocument    { ... service: MunicipalityService ... }
model ServiceWorkflowTask { ... service, department, section ... }
```

**Expected endpoints:**
```
GET    /services                          — citizens: list published
GET    /services/:id                      — citizens: get details
GET    /admin/services                    — admin: list all
POST   /admin/services                    — admin: create (DRAFT)
PATCH  /admin/services/:id               — admin: update
DELETE /admin/services/:id               — admin: delete (no active requests)
POST   /admin/services/:id/publish        — admin: DRAFT → PUBLISHED
POST   /admin/services/:id/archive        — admin: PUBLISHED → ARCHIVED
POST   /admin/services/:id/documents      — add required doc
DELETE /admin/services/:id/documents/:docId
POST   /admin/services/:id/workflow       — add workflow task
PATCH  /admin/services/:id/workflow/:taskId
DELETE /admin/services/:id/workflow/:taskId
```

**Dependencies to import in new ServicesModule:** `AuthModule`, `OrgModule` (for dept/section validation).

---

## Conventions for New Modules

- Files: `kebab-case.use-case.ts`, `kebab-case.controller.ts`
- Tests: `src/usecases/<module>/__tests__/<name>.use-case.spec.ts`
- Use case factory pattern in tests: `makeRepo()` returns `jest.Mocked<IRepo>`, `makeEntity(overrides?)` builds stubs
- Module provides both repo token bindings AND all use cases; exports repo tokens
- RBAC via `@Roles(...UserRole)` + `@UseGuards(JwtAuthGuard, RolesGuard)` — both guards always applied together
- BigInt IDs: URL params arrive as `string`, convert with `BigInt(id)` in controller; never send raw BigInt in JSON (serializer handles it)
