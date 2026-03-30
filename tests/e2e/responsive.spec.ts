import { test, expect, devices } from '@playwright/test';
import { WelcomePage } from './pages';

test.describe('Responsive Design', () => {
  test('renders correctly at 320px width (minimum mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();

    // Buttons should not overflow the viewport
    const getStarted = welcome.getStartedButton;
    const box = await getStarted.boundingBox();
    if (box) {
      expect(box.x + box.width).toBeLessThanOrEqual(320);
    }
  });

  test('renders correctly at tablet width (768px)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();
  });

  test('renders correctly at desktop width (1024px)', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();
  });
});
