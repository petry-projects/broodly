import { test, expect } from '@playwright/test';
import { WelcomePage } from './pages';

test.describe('Accessibility', () => {
  test('welcome screen buttons have accessible labels', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();

    // Buttons must have aria-label for screen readers
    await expect(welcome.getStartedButton).toHaveAttribute('aria-label', /.+/);
    await expect(welcome.signInButton).toHaveAttribute('aria-label', /.+/);
  });

  test('interactive elements meet 48px minimum touch target', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();

    // CLAUDE.md requirement: 48x48px minimum for gloved field use
    const getStartedBox = await welcome.getStartedButton.boundingBox();
    expect(getStartedBox).not.toBeNull();
    expect(getStartedBox!.height).toBeGreaterThanOrEqual(48);

    const signInBox = await welcome.signInButton.boundingBox();
    expect(signInBox).not.toBeNull();
    expect(signInBox!.height).toBeGreaterThanOrEqual(48);
  });

  test('no runtime errors on welcome screen', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();
    await welcome.assertNoCrash();

    expect(errors).toEqual([]);
  });

  test('keyboard Tab moves focus to an interactive element', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();

    // Tab into the page
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();

    // Focused element must be interactive (button, link, or input)
    const role = await focused.getAttribute('role');
    const tagName = await focused.evaluate((el) => el.tagName.toLowerCase());
    const isInteractive =
      role === 'button' ||
      role === 'link' ||
      tagName === 'button' ||
      tagName === 'a' ||
      tagName === 'input';
    expect(isInteractive).toBe(true);
  });
});
