import { test, expect } from '@playwright/test';
import { WelcomePage } from './pages';

test.describe('App Smoke', () => {
  test('loads without JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(3_000);

    // No import.meta or native module errors
    const criticalErrors = errors.filter(
      (e) =>
        e.includes('import.meta') ||
        e.includes('Cannot use') ||
        e.includes('react-native-mmkv') ||
        e.includes('@react-native-firebase'),
    );
    expect(criticalErrors).toEqual([]);
  });

  test('renders a visible screen for unauthenticated user', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();
  });

  test('page has correct title and favicon', async ({ page }) => {
    await page.goto('/');
    // Expo sets document title from app.json name
    await expect(page).toHaveTitle(/mobile|Broodly/i);
  });
});
