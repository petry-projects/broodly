import { test, expect } from '@playwright/test';
import { WelcomePage } from './pages';

test.describe('Navigation & Auth Guard', () => {
  test('unauthenticated user is redirected to onboarding', async ({ page }) => {
    // Navigate directly to a protected route
    await page.goto('/apiaries');

    // Auth guard should redirect to onboarding
    const welcome = new WelcomePage(page);
    await welcome.waitForAuthReady();

    // Should see onboarding or auth content, not apiaries
    const bodyText = await page.locator('body').textContent();
    expect(
      bodyText?.includes('Welcome') ||
      bodyText?.includes('Broodly') ||
      bodyText?.includes('Sign in') ||
      bodyText?.includes('Create'),
    ).toBeTruthy();
  });

  test('direct navigation to /plan redirects unauthenticated user', async ({ page }) => {
    await page.goto('/plan');

    const welcome = new WelcomePage(page);
    await welcome.waitForAuthReady();

    // Should not see plan content
    await expect(page.getByText(/Loading your plan/i)).not.toBeVisible();
  });

  test('tab bar is not visible for unauthenticated users', async ({ page }) => {
    await page.goto('/');

    const welcome = new WelcomePage(page);
    await welcome.waitForAuthReady();

    // Tab navigation items should not be visible in onboarding
    await expect(page.getByTestId('start-plan-btn')).not.toBeVisible();
    await expect(page.getByTestId('view-apiaries-btn')).not.toBeVisible();
  });
});
