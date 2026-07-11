# Mentora AI — Your Personal Student Mentor

Mentora AI is a polished, locally runnable MVP for an AI-powered student mentoring PWA. Students can create a profile, enter or upload report-card marks, view performance analysis, chat with a mock AI mentor, generate mock tests, follow a weekly study plan, edit settings, and explore career clusters as guidance rather than deterministic advice.

## Screenshots
- Landing page: placeholder for `/screenshots/landing.png`
- Dashboard: placeholder for `/screenshots/dashboard.png`
- Mock test results: placeholder for `/screenshots/mock-test.png`

## Technology Stack
Next.js App Router, TypeScript strict mode, Tailwind CSS, accessible reusable components, Lucide icons, Recharts, React Hook Form, Zod, Auth.js (credentials + JWT sessions), PostgreSQL with Prisma, Vitest, and Playwright. Signed-out visitors get a localStorage demo mode; signed-in users get server persistence.

## Local Setup
```bash
npm install
npm run dev
```
Open http://localhost:3000 and click **Load Demo Account** — demo mode needs no database or configuration.

For real accounts (sign-up, PostgreSQL persistence), set up the Phase 1 backend: see [docs/BACKEND.md](docs/BACKEND.md) for database setup, migrations, environment variables, testing, and deployment.

## Environment Variables
Copy `.env.example` to `.env`. Demo mode works with none of them set; accounts require `DATABASE_URL` and `AUTH_SECRET` (documented in [docs/BACKEND.md](docs/BACKEND.md)). The mock AI provider remains the default via `AI_PROVIDER=mock`.

## Available Scripts
- `npm run dev` — start the development server
- `npm run build` — build the app
- `npm run lint` — lint source files
- `npm run typecheck` — run TypeScript checks
- `npm run test` — run unit tests
- `npm run test:e2e` — run Playwright flow

## Application Architecture
- `app/` routes, screens, and `app/api/` route handlers
- `components/` reusable UI primitives and shell
- `services/` AI mentor, OCR, client storage/sync, study-plan, and career abstractions
- `server/` Prisma-backed repository (all database access)
- `prisma/` schema and migrations
- `lib/` validation schemas, database client, calculations, and utilities
- `data/` seeded demo data and mock test bank
- `types/` shared domain models
- `tests/` unit and integration tests
- `e2e/` Playwright tests

See [docs/BACKEND.md](docs/BACKEND.md) for the Phase 1 backend architecture diagram and API reference.

## Current Limitations
- AI and OCR are simulated by mock providers (real providers are Phase 2, server-side only).
- No email verification or password reset yet — required before public sign-ups.
- Rate limiting is an in-memory placeholder.
- Icons are placeholder SVG assets.

## Future Roadmap
1. Server-side OpenAI provider with moderation and audit logging.
2. Student/parent roles and email verification.
3. Real OCR for report cards as async jobs.
4. Expand curriculum-aligned question banks and analytics.
5. Add counselor-reviewed career resources.

## Deployment
Build with `npm run build`, set environment variables, and deploy to a Next.js-compatible host such as Vercel, Netlify, or a container platform. Keep API keys server-side only.
