# Mentora AI — Your Personal Student Mentor

Mentora AI is a polished, locally runnable MVP for an AI-powered student mentoring PWA. Students can create a profile, enter or upload report-card marks, view performance analysis, chat with a mock AI mentor, generate mock tests, follow a weekly study plan, edit settings, and explore career clusters as guidance rather than deterministic advice.

## Screenshots
- Landing page: placeholder for `/screenshots/landing.png`
- Dashboard: placeholder for `/screenshots/dashboard.png`
- Mock test results: placeholder for `/screenshots/mock-test.png`

## Technology Stack
Next.js App Router, TypeScript strict mode, Tailwind CSS, accessible reusable components, Lucide icons, Recharts, React Hook Form, Zod, local storage persistence, Vitest, and Playwright.

## Local Setup
```bash
npm install
npm run dev
```
Open http://localhost:3000 and click **Load Demo Account**.

## Environment Variables
Copy `.env.example` to `.env.local`. The MVP uses `AI_PROVIDER=mock` by default. `OPENAI_API_KEY`, `DATABASE_URL`, and auth values are placeholders for future integrations.

## Available Scripts
- `npm run dev` — start the development server
- `npm run build` — build the app
- `npm run lint` — lint source files
- `npm run typecheck` — run TypeScript checks
- `npm run test` — run unit tests
- `npm run test:e2e` — run Playwright flow

## Application Architecture
- `app/` routes and screens
- `components/` reusable UI primitives and shell
- `services/` AI mentor, OCR, storage, study-plan, and career abstractions
- `data/` seeded demo data and mock test bank
- `types/` shared domain models
- `lib/` calculations and utilities
- `tests/` unit tests
- `e2e/` Playwright tests

## Current MVP Limitations
- AI and OCR are simulated by mock providers.
- Data persists in browser local storage only.
- Authentication, PostgreSQL, production OCR, and real OpenAI calls are intentionally not enabled.
- Icons are placeholder SVG assets.

## Future Roadmap
1. Add secure authentication and student/parent roles.
2. Implement backend APIs and PostgreSQL repositories.
3. Add server-side OpenAI provider with moderation and audit logging.
4. Integrate real OCR for report cards.
5. Expand curriculum-aligned question banks and analytics.
6. Add counselor-reviewed career resources.

## Deployment
Build with `npm run build`, set environment variables, and deploy to a Next.js-compatible host such as Vercel, Netlify, or a container platform. Keep API keys server-side only.
