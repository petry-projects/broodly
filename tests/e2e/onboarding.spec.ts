import { test, expect } from '@playwright/test';
import { WelcomePage, OnboardingPage } from './pages';

test.describe('Onboarding Flow', () => {
  test('Get Started navigates to create account screen', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);
    await onboarding.assertOnCreateAccount();
  });

  test('create account shows progress dots, ToS, and both auth providers', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);

    // Progress indicator must be present
    await expect(onboarding.progressDots).toBeVisible();

    // ToS checkbox must be present
    await expect(onboarding.tosCheckbox).toBeVisible();

    // Both sign-in providers required on all platforms including web (FR1a, FR1b)
    await expect(onboarding.googleSignInButton).toBeVisible();
    await expect(onboarding.appleSignInButton).toBeVisible();
  });

  test('sign-in buttons are disabled until ToS is accepted', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);

    // Both buttons must be disabled before ToS acceptance
    await expect(onboarding.googleSignInButton).toBeDisabled();
    await expect(onboarding.appleSignInButton).toBeDisabled();

    // Accept ToS
    await onboarding.acceptTos();

    // Both buttons must be enabled after ToS acceptance
    await expect(onboarding.googleSignInButton).toBeEnabled();
    await expect(onboarding.appleSignInButton).toBeEnabled();
  });

  test('Sign In navigates to sign-in screen with both providers', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickSignIn();

    // Sign-in screen must show welcome text and both providers
    await expect(page.getByText(/Welcome to Broodly/)).toBeVisible();
    await expect(page.getByTestId('google-sign-in')).toBeVisible();
    await expect(page.getByTestId('apple-sign-in')).toBeVisible();
  });

  test('offline continue advances to experience level when available', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);
    const offlineBtn = onboarding.offlineContinueButton;

    // Offline continue only appears when offline — skip if not present
    if (await offlineBtn.isVisible().catch(() => false)) {
      await onboarding.acceptTos();
      await offlineBtn.click();
      await onboarding.assertOnExperienceLevel();
    }
  });
});
