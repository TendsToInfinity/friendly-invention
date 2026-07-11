import { expect, test } from '@playwright/test';

test('demo account dashboard mock test results flow', async ({ page }) => {
  await page.goto('/');
  // Retry the click until navigation happens: on a cold dev-server compile the
  // button can render before React hydration attaches its click handler.
  await expect(async () => {
    await page.getByRole('button', { name: 'Load Demo Account' }).first().click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /Welcome back, Aarav/ })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('link', { name: /Start mock test/i }).click();
  await page.getByRole('button', { name: 'Generate Test' }).click();
  await page.getByText(/Question 1/).waitFor();

  await page.getByRole('button', { name: /4/ }).click();
  // exact: true avoids matching the Next.js dev-tools overlay button.
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /\(x-3\)\(x\+3\)/ }).click();
  await page.getByRole('button', { name: 'Submit Test' }).click();

  await expect(page.getByText(/Results:/)).toBeVisible();
});
