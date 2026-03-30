import { test, expect } from '@playwright/test';
import { WelcomePage, OnboardingPage } from './pages';

test.describe('Onboarding Flow', () => {
  test('welcome screen shows Get Started and Sign In buttons', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.assertVisible();
    await expect(welcome.getStartedButton).toBeVisible();
    await expect(welcome.signInButton).toBeVisible();
  });

  test('Get Started navigates to create account screen', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);
    await onboarding.assertOnCreateAccount();
  });

  test('create account screen shows ToS checkbox and sign-in buttons', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);
    await expect(onboarding.tosCheckbox).toBeVisible();
    // Google sign-in should be visible (web platform)
    await expect(onboarding.googleSignInButton).toBeVisible();
  });

  test('sign-in buttons are disabled until ToS is accepted', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);
    // Google button should be disabled before ToS
    await expect(onboarding.googleSignInButton).toBeDisabled();

    // Accept ToS
    await onboarding.acceptTos();

    // Now button should be enabled
    await expect(onboarding.googleSignInButton).toBeEnabled();
  });

  test('offline continue works when ToS accepted', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);

    // If offline banner shows continue button, test it
    const offlineBtn = onboarding.offlineContinueButton;
    if (await offlineBtn.isVisible().catch(() => false)) {
      await onboarding.acceptTos();
      await offlineBtn.click();
      await onboarding.assertOnExperienceLevel();
    }
  });

  test('Sign In button navigates to auth sign-in screen', async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickSignIn();

    // Should see the sign-in screen
    await expect(page.getByText(/Sign in/)).toBeVisible();
  });
});

test.describe('Onboarding Step Navigation', () => {
  // Helper: navigate through onboarding to a specific step
  async function navigateToStep(page: import('@playwright/test').Page, targetStep: string) {
    const welcome = new WelcomePage(page);
    const onboarding = new OnboardingPage(page);

    await welcome.goto();
    await welcome.clickGetStarted();

    // Create account: accept ToS and continue offline
    await onboarding.acceptTos();
    const offlineBtn = onboarding.offlineContinueButton;
    if (await offlineBtn.isVisible().catch(() => false)) {
      await offlineBtn.click();
    }
    if (targetStep === 'experience') return;

    // Experience level
    await onboarding.selectExperienceLevel('amateur');
    await onboarding.clickNext();
    if (targetStep === 'region') return;

    // Region
    await onboarding.enterRegion('Pacific Northwest');
    await onboarding.clickNext();
    if (targetStep === 'apiary') return;
  }

  test('experience level screen renders and accepts selection', async ({ page }) => {
    await navigateToStep(page, 'experience');

    const onboarding = new OnboardingPage(page);
    await onboarding.assertOnExperienceLevel();

    // Select a level
    await onboarding.selectExperienceLevel('newbie');
    await expect(onboarding.nextButton).toBeEnabled();
  });

  test('region screen accepts text input and navigates forward', async ({ page }) => {
    await navigateToStep(page, 'region');

    const onboarding = new OnboardingPage(page);
    await onboarding.assertOnRegionSetup();

    await onboarding.enterRegion('Oregon');
    await expect(onboarding.nextButton).toBeEnabled();
  });

  test('apiary setup screen renders name input', async ({ page }) => {
    await navigateToStep(page, 'apiary');

    const onboarding = new OnboardingPage(page);
    await onboarding.assertOnApiarySetup();
    await expect(onboarding.apiaryNameInput).toBeVisible();
  });
});
