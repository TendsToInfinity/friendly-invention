# Mentora AI — Phase 1 Backend

Phase 1 turns the localStorage-only MVP into a SaaS-ready foundation:
real accounts, PostgreSQL persistence, an authenticated API, and a client
cache layer that keeps the entire existing UI unchanged.

## Architecture

```mermaid
flowchart TB
    subgraph Browser
        UI["Pages & components<br/>(unchanged)"]
        Hooks["hooks/useDemoData<br/>waits for sync"]
        Repo["services/storage.ts<br/>sync reads · write-through writes"]
        LS[("localStorage<br/>= cache, not source of truth")]
        Sync["services/sync.ts<br/>bootstrap once per load"]
        API_C["services/api-client.ts"]
    end

    subgraph Server["Next.js server"]
        Proxy["proxy.ts<br/>optimistic route protection"]
        Auth["Auth.js (JWT sessions)<br/>credentials + bcrypt"]
        Routes["app/api/* route handlers<br/>auth → rate limit → Zod"]
        SrvRepo["server/repository.ts<br/>userId-scoped queries"]
        Prisma["Prisma 7 + adapter-pg"]
    end

    PG[("PostgreSQL<br/>local dev / Neon prod")]

    UI --> Hooks --> Repo --> LS
    Hooks --> Sync --> API_C
    Repo -. "cloud mode writes" .-> API_C
    API_C --> Routes
    Routes --> Auth
    Routes --> SrvRepo --> Prisma --> PG
```

**Two modes, one UI.** Signed-out visitors run in *demo mode*: localStorage
only, exactly the original MVP behavior (a `mentora-demo` cookie lets them
through route protection). Signed-in users run in *cloud mode*: on first
data access, `services/sync.ts` fetches `/api/bootstrap` and hydrates
localStorage; every subsequent write updates the cache synchronously and
fires a write-through API call. Pages keep calling the same synchronous
`repo` methods and cannot tell the difference.

**Authorization model.** The session JWT carries the user id. Every route
handler resolves the user via `auth()` and passes `userId` into
`server/repository.ts`, which scopes every query to it. Client payloads
never contain user ids. `proxy.ts` is optimistic UX-level protection only
(cookie presence); the API layer is the enforced boundary.

**Why Auth.js over Clerk.** No third-party account needed to run dev, CI,
or self-hosted deployments; zero cost; sessions are stateless JWTs. The
integration surface is `auth()` + `signIn()/signOut()`, so migrating to
Clerk later touches auth wiring only, not the data layer.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string. Neon in production (`?sslmode=require`) |
| `AUTH_SECRET` | yes | Auth.js JWT signing secret. `openssl rand -base64 32`, unique per environment |
| `TEST_DATABASE_URL` | no | Overrides the DB used by `npm test` (defaults to `mentora_test` on localhost) |
| `AI_PROVIDER` | no | `mock` (default). Real providers must be server-side only |
| `OPENAI_API_KEY` | no | Reserved for the future server-side AI route. Never exposed to the client |
| `NEXT_PUBLIC_APP_URL` | no | Public origin, used by future integrations |

Local setup: copy `.env.example` to `.env`, create the databases, migrate:

```bash
sudo -u postgres psql -c "CREATE USER mentora WITH PASSWORD 'mentora_dev' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE mentora OWNER mentora;"
sudo -u postgres psql -c "CREATE DATABASE mentora_test OWNER mentora;"
npm run db:migrate           # applies prisma/migrations to DATABASE_URL
DATABASE_URL=postgresql://mentora:mentora_dev@localhost:5432/mentora_test npx prisma db push
npm run dev
```

Demo mode needs no configuration at all — `npm run dev` and "Load Demo
Account" work without a database.

## API surface

| Endpoint | Methods | Notes |
|---|---|---|
| `/api/auth/signup` | POST | Zod-validated, rate-limited (5/min/IP), bcrypt cost 12 |
| `/api/auth/[...nextauth]` | GET/POST | Auth.js sign-in/sign-out/session |
| `/api/profile` | GET, PUT | Student profile (upsert) |
| `/api/report-cards` | GET, POST | POST creates a new card (history preserved), GET lists newest-first |
| `/api/chat` | GET, PUT | PUT replaces history (matches client save semantics) |
| `/api/study-plan` | GET, PUT | One current plan per student, replaced transactionally |
| `/api/attempts` | GET, POST | Mock-test attempts, append-only |
| `/api/bootstrap` | GET | Single-round-trip hydration payload after sign-in |

All non-auth endpoints return `401` without a session, `400` on validation
failure, `409` before onboarding creates a profile, and `429` when
rate-limited. Rate limiting is an in-memory placeholder
(`lib/rate-limit.ts`) — swap in `@upstash/ratelimit` + Redis behind the same
function signature before real traffic.

## Migration strategy: localStorage → PostgreSQL

1. **Phase 1 (this change).** localStorage becomes a cache. Demo mode is
   untouched; accounts get server persistence with write-through. No UI or
   page-component changes; the sync layer hides the difference.
2. **Adopting a demo user's data.** When a demo visitor signs up, their
   local demo data is cleared and they onboard fresh (deliberate: demo data
   is seeded fiction, not user data worth migrating).
3. **Phase 2 (later).** Move reads to server components/React Query per
   page, retire the localStorage cache, delete demo mode or gate it behind
   a `/demo` sandbox. The `repo` interface localizes that work.

## Testing

```bash
npm test          # 29 tests: validation units + repository & API integration (real Postgres)
npm run test:e2e  # demo flow (no DB needed) + full auth lifecycle (needs DB)
SKIP_DB_E2E=1 npm run test:e2e   # skip the DB-dependent spec
```

Integration tests run against `TEST_DATABASE_URL` (never the dev DB) and
truncate between cases. The auth e2e proves the core promise: wipe
localStorage, reload, and the dashboard comes back from PostgreSQL.

## Deployment (Vercel + Neon)

1. **Neon**: create a project → copy the pooled connection string
   (`...-pooler.neon.tech/...?sslmode=require`). Prisma's pg adapter works
   with PgBouncer pooling.
2. **Vercel**: import the repo. Set `DATABASE_URL` and `AUTH_SECRET` env
   vars (Production + Preview). Build command stays `next build`
   (`postinstall` runs `prisma generate`).
3. **Migrations**: run `npm run db:deploy` against the production
   `DATABASE_URL` as a release step (locally, or a CI job) — do not rely on
   `db push` in production.
4. **Backups**: Neon provides point-in-time restore; no custom backup
   machinery needed at this stage.

## Known Phase 1 limitations (deliberate)

- AI and OCR remain mocks — real providers are Phase 2, server-side.
- Write-through is fire-and-forget: a failed API write logs to the console
  and keeps the local copy; there is no retry queue or conflict resolution
  yet (single-device usage assumed at this stage).
- In-memory rate limiter resets per instance/deploy.
- No email verification or password reset yet — required before public
  sign-ups.
