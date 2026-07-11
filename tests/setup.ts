import 'dotenv/config';

// Server-side tests (repository, API handlers) run against the dedicated
// test database so they can never touch dev data. Override with
// TEST_DATABASE_URL in CI. The credentials below exist only on local dev
// machines (see docs/BACKEND.md).
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgresql://mentora:mentora_dev@localhost:5432/mentora_test';
process.env.AUTH_SECRET ??= 'test-secret-not-for-production';
