import { test, expect } from '@playwright/test';
import { WelcomePage } from './pages';

test.describe('Responsive Design', () => {
  test('renders correctly at 320px mobile width without overflow', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();

    // Buttons must not overflow the viewport
    const box = await welcome.getStartedButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(320);

    // No horizontal scrollbar
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(320);
  });

  test('renders correctly at 768px tablet width', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();

    await expect(welcome.getStartedButton).toBeVisible();
    await expect(welcome.signInButton).toBeVisible();
  });

  test('renders correctly at 1024px desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();

    await expect(welcome.getStartedButton).toBeVisible();
    await expect(welcome.signInButton).toBeVisible();
  });
});
