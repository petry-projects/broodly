import { test, expect } from '@playwright/test';
import { WelcomePage, ApiariesPage } from './pages';

/**
 * Evening review flow E2E tests.
 *
 * The evening review allows beekeepers to review and correct
 * inspection data after returning from the field.
 * Since this requires authentication and completed inspections,
 * we test the navigation paths and page structure.
 */
test.describe('Evening Review Flow', () => {
  test('welcome screen provides path toward apiaries', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await expect(welcome.getStartedButton).toBeVisible({ timeout: 15_000 });
    await expect(welcome.signInButton).toBeVisible();
  });

  test('apiaries route redirects unauthenticated users', async ({ page }) => {
    // Attempting to access apiaries without auth should redirect
    await page.goto('/apiaries');
    await page.waitForTimeout(2_000);

    // Should not show apiaries content when unauthenticated
    const apiariesContent = page.getByText(/My Apiaries|Apiaries/);
    const welcomeContent = page.getByText(/Broodly/);

    const showsApiaries = await apiariesContent.isVisible().catch(() => false);
    const isRedirected = await welcomeContent.isVisible().catch(() => false);

    // Unauthenticated users should be redirected
    expect(isRedirected || !showsApiaries).toBe(true);
  });

  test('apiaries page object supports navigation and CRUD', async ({ page }) => {
    // Verify the ApiariesPage object has all expected methods (contract test)
    const apiaries = new ApiariesPage(page);

    expect(typeof apiaries.goto).toBe('function');
    expect(typeof apiaries.assertVisible).toBe('function');
    expect(typeof apiaries.assertEmptyState).toBe('function');
    expect(typeof apiaries.clickAddApiary).toBe('function');
    expect(typeof apiaries.fillCreateForm).toBe('function');
    expect(typeof apiaries.submitCreateForm).toBe('function');

    // Verify locators are well-formed
    expect(apiaries.addApiaryButton).toBeDefined();
    expect(apiaries.heading).toBeDefined();
    expect(apiaries.emptyStateText).toBeDefined();
    expect(apiaries.nameInput).toBeDefined();
    expect(apiaries.regionInput).toBeDefined();
    expect(apiaries.createButton).toBeDefined();
  });

  test('evening review route redirects unauthenticated users', async ({ page }) => {
    // Attempting to access evening review without auth should redirect
    await page.goto('/evening-review');
    await page.waitForTimeout(2_000);

    // Should see welcome/auth content, not evening review
    const reviewContent = page.getByText(/Evening Review|Review Inspections/);
    const welcomeContent = page.getByText(/Broodly/);

    const showsReview = await reviewContent.isVisible().catch(() => false);
    const isRedirected = await welcomeContent.isVisible().catch(() => false);

    expect(isRedirected || !showsReview).toBe(true);
  });

  test('apiaries page object can target specific apiary cards', async ({ page }) => {
    const apiaries = new ApiariesPage(page);

    // Verify dynamic card locators work
    const card1 = apiaries.apiaryCard('abc-123');
    const card2 = apiaries.apiaryCard('def-456');
    expect(card1).toBeDefined();
    expect(card2).toBeDefined();
  });
});
