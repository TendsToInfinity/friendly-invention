import { expect, test } from '@playwright/test';

/**
 * Full account lifecycle against a real database:
 * sign up → onboard → data persists across a wiped localStorage (proving
 * server persistence) → sign out → route protection kicks in.
 *
 * Requires DATABASE_URL and AUTH_SECRET (see docs/BACKEND.md). Set
 * SKIP_DB_E2E=1 to skip in environments without PostgreSQL.
 */
test.skip(!!process.env.SKIP_DB_E2E, 'requires a PostgreSQL database');

test('sign up, onboard, persist across devices, sign out', async ({ page }) => {
  const email = `e2e-${Date.now()}@test.dev`;

  // Sign up
  await page.goto('/sign-up');
  await page.fill('input[type="email"]', email);
  await page.locator('input[type="password"]').nth(0).fill('password123');
  await page.locator('input[type="password"]').nth(1).fill('password123');
  await page.getByRole('button', { name: 'Sign up' }).click();
  await page.waitForURL(/onboarding/, { timeout: 30_000 });

  // Onboard (3 steps)
  await page.fill('input[name="name"]', 'E2E Student');
  await page.fill('input[name="age"]', '16');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.fill('input[name="subjects"]', 'Mathematics, Physics');
  await page.fill('input[name="strong"]', 'Mathematics');
  await page.fill('input[name="weak"]', 'Physics');
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.fill('input[name="interests"]', 'space, coding');
  await page.fill('input[name="careers"]', 'Engineering');
  await page.fill('input[name="goal"]', 'Ace the physics exam');
  await page.getByRole('button', { name: 'Finish onboarding' }).click();
  await expect(page.getByRole('heading', { name: /Welcome back, E2E Student/ })).toBeVisible({
    timeout: 30_000,
  });

  // Wipe the local cache and reload: data must come back from the server.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByRole('heading', { name: /Welcome back, E2E Student/ })).toBeVisible({
    timeout: 30_000,
  });

  // Sign out, then protected routes redirect to sign-in.
  await page.getByRole('button', { name: 'Sign out' }).first().click();
  await page.waitForURL(/localhost:3000\/$|127\.0\.0\.1:3000\/$/, { timeout: 15_000 });
  await page.goto('/dashboard');
  await page.waitForURL(/sign-in/, { timeout: 15_000 });
});
