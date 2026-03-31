import { test, expect } from '@playwright/test';

test.describe('Navigation & Auth Guard', () => {
  test('unauthenticated user accessing /apiaries is redirected to onboarding', async ({ page }) => {
    await page.goto('/apiaries');

    // Auth guard must redirect — onboarding welcome buttons should appear
    await expect(page.getByTestId('get-started-btn')).toBeVisible({ timeout: 10_000 });

    // Apiaries content must NOT be visible
    await expect(page.getByText(/My Apiaries/i)).not.toBeVisible();
    await expect(page.getByTestId('add-apiary-btn')).not.toBeVisible();
  });

  test('unauthenticated user accessing /plan is redirected to onboarding', async ({ page }) => {
    await page.goto('/plan');

    // Auth guard must redirect to onboarding
    await expect(page.getByTestId('get-started-btn')).toBeVisible({ timeout: 10_000 });
  });

  test('authenticated-only UI is not visible for unauthenticated users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('get-started-btn')).toBeVisible({ timeout: 10_000 });

    // Home screen CTAs must not be present on onboarding
    await expect(page.getByTestId('start-plan-btn')).not.toBeVisible();
    await expect(page.getByTestId('view-apiaries-btn')).not.toBeVisible();
  });
});
