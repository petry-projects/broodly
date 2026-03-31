import { test, expect } from '@playwright/test';
import { WelcomePage } from './pages';

test.describe('App Smoke', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const welcome = new WelcomePage(page);
    await welcome.goto();
    // Wait for real UI to render — not an arbitrary timeout
    await expect(welcome.getStartedButton).toBeVisible({ timeout: 15_000 });

    // Zero JS errors — no filtering, no exceptions
    expect(errors).toEqual([]);
  });

  test('renders welcome screen with branding and CTAs', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();

    // Assert specific branding elements — not vague body text checks
    await expect(welcome.heading).toBeVisible();
    await expect(welcome.getStartedButton).toBeVisible();
    await expect(welcome.signInButton).toBeVisible();
    await expect(page.getByText(/Make the right decision/)).toBeVisible();
    await expect(page.getByText(/Field-first beekeeping/)).toBeVisible();
  });

  test('page has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/mobile|Broodly/i);
  });
});
