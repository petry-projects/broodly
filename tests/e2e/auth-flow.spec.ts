import { test, expect } from '@playwright/test';
import { WelcomePage, OnboardingPage } from './pages';

/**
 * Auth flow tests run with EXPO_PUBLIC_FIREBASE_API_KEY=fake-api-key,
 * so all Firebase auth attempts will fail. These tests validate that
 * the app handles auth failures gracefully: shows error feedback to
 * the user and recovers to an interactive state.
 */
test.describe('Authentication Error Handling', () => {
  test('Google sign-in failure shows error and recovers', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);
    await onboarding.acceptTos();
    await expect(onboarding.googleSignInButton).toBeEnabled();

    // Trigger sign-in — will fail with fake-api-key
    await onboarding.googleSignInButton.click();

    // App must show user-facing error feedback (not silently fail)
    await expect(onboarding.authErrorAlert).toBeVisible({ timeout: 15_000 });
    await expect(onboarding.authErrorAlert).toHaveText(/.+/);

    // App must recover: buttons re-enabled, not stuck in loading state
    await expect(onboarding.googleSignInButton).toBeEnabled({ timeout: 5_000 });
    await expect(onboarding.appleSignInButton).toBeEnabled({ timeout: 5_000 });
  });

  test('Apple sign-in failure shows error and recovers', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);
    await onboarding.acceptTos();
    await expect(onboarding.appleSignInButton).toBeEnabled();

    // Trigger sign-in — will fail with fake-api-key
    await onboarding.appleSignInButton.click();

    // App must show user-facing error feedback
    await expect(onboarding.authErrorAlert).toBeVisible({ timeout: 15_000 });
    await expect(onboarding.authErrorAlert).toHaveText(/.+/);

    // App must recover to interactive state
    await expect(onboarding.googleSignInButton).toBeEnabled({ timeout: 5_000 });
    await expect(onboarding.appleSignInButton).toBeEnabled({ timeout: 5_000 });
  });

  test('sign-in screen auth failure shows error and recovers', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickSignIn();

    const googleBtn = page.getByTestId('google-sign-in');
    const appleBtn = page.getByTestId('apple-sign-in');
    await expect(googleBtn).toBeVisible();

    // Trigger sign-in — will fail with fake-api-key
    await googleBtn.click();

    // Error feedback must appear with meaningful text
    const authError = page.locator('[role="alert"]').filter({
      hasText: /try again|went wrong|cancelled|timed out|failed/i,
    });
    await expect(authError).toBeVisible({ timeout: 15_000 });
    await expect(authError).toHaveText(/.+/);

    // Buttons must be re-enabled for retry
    await expect(googleBtn).toBeEnabled({ timeout: 5_000 });
    await expect(appleBtn).toBeEnabled({ timeout: 5_000 });
  });
});
