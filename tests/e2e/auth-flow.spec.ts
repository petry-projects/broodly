import { test, expect } from '@playwright/test';
import { WelcomePage, OnboardingPage } from './pages';

test.describe('Authentication Flow', () => {
  test('Google sign-in button is clickable after ToS accepted', async ({ page, context }) => {
    // Track popups and console
    const popups: string[] = [];
    context.on('page', (p) => popups.push(p.url()));
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text().substring(0, 200));
    });
    page.on('pageerror', (err) => consoleErrors.push(err.message.substring(0, 200)));

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    // Wait for create-account content to render
    await expect(page.locator('body')).toContainText('Create your account', { timeout: 10_000 });

    const onboarding = new OnboardingPage(page);
    await expect(onboarding.googleSignInButton).toBeDisabled();
    await onboarding.acceptTos();
    await expect(onboarding.googleSignInButton).toBeEnabled();

    // Click Google sign-in
    await onboarding.googleSignInButton.click();
    await page.waitForTimeout(8_000);

    // Log diagnostic info
    console.log(`Popups opened: ${popups.length} (${popups.join(', ')})`);
    console.log(`Console errors: ${consoleErrors.length}`);
    consoleErrors.forEach(e => console.log(`  ${e}`));
    console.log(`Current URL: ${page.url()}`);
    console.log(`Body text (first 200): ${(await page.locator('body').textContent())?.substring(0, 200)}`);

    // App must show visible feedback — error alert, loading, or popup
    const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false);
    const hasLoading = await page.locator('[role="progressbar"]').isVisible().catch(() => false);
    const hasPopup = popups.length > 0;

    expect(hasError || hasLoading || hasPopup).toBeTruthy();
  });

  test('Apple sign-in button is clickable after ToS accepted', async ({ page, context }) => {
    const popups: string[] = [];
    context.on('page', (p) => popups.push(p.url()));

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    await expect(page.locator('body')).toContainText('Create your account', { timeout: 10_000 });

    const onboarding = new OnboardingPage(page);
    await onboarding.acceptTos();
    await expect(page.getByTestId('apple-sign-in')).toBeEnabled();

    await page.getByTestId('apple-sign-in').click();
    await page.waitForTimeout(8_000);

    const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false);
    const hasPopup = popups.length > 0;
    expect(hasError || hasPopup).toBeTruthy();
  });

  test('auth attempt with fake credentials shows feedback', async ({ page, context }) => {
    // With fake-api-key, Firebase auth attempts will fail.
    // The app must show SOME feedback (popup attempt, error, or loading).
    const popups: string[] = [];
    context.on('page', (p) => popups.push(p.url()));

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    await expect(page.locator('body')).toContainText('Create your account', { timeout: 10_000 });

    const onboarding = new OnboardingPage(page);
    await onboarding.acceptTos();
    await onboarding.googleSignInButton.click();
    await page.waitForTimeout(8_000);

    // Firebase opens a popup to its auth handler — with fake credentials this fails
    expect(popups.length).toBeGreaterThan(0);
  });

  test('sign-in screen shows both providers and responds to click', async ({ page, context }) => {
    const popups: string[] = [];
    context.on('page', (p) => popups.push(p.url()));

    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickSignIn();

    await expect(page.locator('body')).toContainText('Welcome to Broodly', { timeout: 10_000 });

    await expect(page.getByTestId('google-sign-in')).toBeVisible();
    await expect(page.getByTestId('apple-sign-in')).toBeVisible();

    await page.getByTestId('google-sign-in').click();
    await page.waitForTimeout(8_000);

    const hasError = await page.locator('[role="alert"]').isVisible().catch(() => false);
    const hasPopup = popups.length > 0;
    expect(hasError || hasPopup).toBeTruthy();
  });
});
