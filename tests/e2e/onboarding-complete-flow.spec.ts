import { test, expect, type Page, type BrowserContext } from '@playwright/test';
import { WelcomePage, OnboardingPage } from './pages';

/**
 * Helper: navigate to a specific onboarding screen via offline bypass.
 *
 * context.setOffline(true) blocks network requests but doesn't reliably
 * fire the browser `offline` event. We dispatch it manually so NetInfo
 * detects the change and updates the connectivity store.
 */
type OnboardingScreen =
  | 'create-account'
  | 'experience'
  | 'region'
  | 'apiary'
  | 'goals'
  | 'disclaimer'
  | 'summary';

async function goOffline(page: Page, context: BrowserContext) {
  // context.setOffline sets navigator.onLine=false and blocks network requests,
  // but NetInfo v12 on web uses navigator.connection's 'change' event (not
  // window 'online'/'offline') when the Connection API is available (Chromium).
  // We must dispatch 'change' on navigator.connection so NetInfo re-reads
  // navigator.onLine and updates the connectivity store.
  await context.setOffline(true);
  await page.evaluate(() => {
    const nav = navigator as Navigator & { connection?: EventTarget };
    if (nav.connection) {
      nav.connection.dispatchEvent(new Event('change'));
    } else {
      window.dispatchEvent(new Event('offline'));
    }
  });
}

async function navigateToScreen(
  page: Page,
  context: BrowserContext,
  target: OnboardingScreen,
  options?: { region?: string },
): Promise<OnboardingPage> {
  const welcome = new WelcomePage(page);
  await welcome.goto();
  await welcome.clickGetStarted();

  const onboarding = new OnboardingPage(page);

  if (target === 'create-account') return onboarding;

  // Offline bypass: block network + fire browser offline event
  await goOffline(page, context);
  await expect(onboarding.offlineContinueButton).toBeVisible({ timeout: 10_000 });
  await onboarding.acceptTos();
  await onboarding.offlineContinueButton.click();
  await onboarding.assertOnExperienceLevel();

  if (target === 'experience') return onboarding;

  await onboarding.selectExperienceLevel('amateur');
  await onboarding.clickNext();
  await onboarding.assertOnRegionSetup();

  if (target === 'region') return onboarding;

  await onboarding.enterRegion(options?.region ?? 'Portland');
  await onboarding.clickNext();
  await onboarding.assertOnApiarySetup();

  if (target === 'apiary') return onboarding;

  await onboarding.enterApiaryName('Test Apiary');
  await onboarding.clickNext();
  await onboarding.assertOnGoalSelection();

  if (target === 'goals') return onboarding;

  await onboarding.selectGoal('health');
  await onboarding.tapAndReadMode.click();
  await onboarding.clickNext();

  // Melbourne triggers catchup assessment — skip it if present
  if (options?.region?.toLowerCase().includes('melbourne')) {
    await onboarding.assertOnCatchupAssessment();
    await onboarding.clickNext();
  }

  await onboarding.assertOnDisclaimer();

  if (target === 'disclaimer') return onboarding;

  await onboarding.acceptDisclaimer();
  await onboarding.clickNext();
  await onboarding.assertOnSummary();

  return onboarding;
}

// Clear persisted Zustand state before each test via addInitScript
// (runs before the page loads, preventing state leakage between tests)
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

// ---------------------------------------------------------------------------
// Happy Path
// ---------------------------------------------------------------------------
test.describe('Happy Path', () => {
  test('completes full 7-step onboarding (northern hemisphere, no catchup)', async ({
    page,
    context,
  }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();

    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);

    // Step 1: Create Account — go offline to bypass auth
    await goOffline(page, context);
    await expect(onboarding.offlineContinueButton).toBeVisible({ timeout: 10_000 });
    await onboarding.acceptTos();
    await onboarding.offlineContinueButton.click();

    // Step 2: Experience Level
    await onboarding.assertOnExperienceLevel();
    await onboarding.selectExperienceLevel('amateur');
    await onboarding.clickNext();

    // Step 3: Region Setup
    await onboarding.assertOnRegionSetup();
    await onboarding.enterRegion('Portland');
    await onboarding.clickNext();

    // Step 4: Apiary Setup
    await onboarding.assertOnApiarySetup();
    await onboarding.enterApiaryName('Backyard Bees');
    // Increment hive count from 1 to 3
    await onboarding.hiveIncrementButton.click();
    await onboarding.hiveIncrementButton.click();
    await expect(onboarding.hiveCountDisplay).toHaveText('3');
    await onboarding.clickNext();

    // Step 5: Goal Selection
    await onboarding.assertOnGoalSelection();
    await onboarding.selectGoal('health');
    await onboarding.selectGoal('learning');
    await onboarding.tapAndReadMode.click();
    await onboarding.clickNext();

    // Portland = northern hemisphere, March = spring → NOT mid-season → skip catchup

    // Step 6: Disclaimer
    await onboarding.assertOnDisclaimer();
    await onboarding.acceptDisclaimer();
    await onboarding.clickNext();

    // Step 7: Summary — verify all selections
    // Use .last() because previous screens remain hidden in the SPA DOM
    await onboarding.assertOnSummary();
    await expect(page.getByText('Amateur').last()).toBeVisible();
    await expect(page.getByText('Portland').last()).toBeVisible();
    await expect(page.getByText(/spring/i).last()).toBeVisible();
    await expect(page.getByText('Backyard Bees').last()).toBeVisible();
    await expect(page.getByText('3', { exact: true }).last()).toBeVisible();
    await expect(page.getByText(/Colony Health/).last()).toBeVisible();
    await expect(page.getByText(/Learning/).last()).toBeVisible();
    await expect(page.getByText(/Tap & Read/).last()).toBeVisible();
    await expect(onboarding.completeButton).toBeEnabled();
  });

  test('completes 8-step onboarding with mid-season catchup (southern hemisphere)', async ({
    page,
    context,
  }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();

    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);

    // Go offline to bypass auth
    await goOffline(page, context);
    await expect(onboarding.offlineContinueButton).toBeVisible({ timeout: 10_000 });
    await onboarding.acceptTos();
    await onboarding.offlineContinueButton.click();

    // Experience Level
    await onboarding.assertOnExperienceLevel();
    await onboarding.selectExperienceLevel('sideliner');
    await onboarding.clickNext();

    // Region: Melbourne = southern hemisphere → fall → mid-season
    await onboarding.assertOnRegionSetup();
    await onboarding.enterRegion('Melbourne');
    await onboarding.clickNext();

    // Apiary Setup
    await onboarding.assertOnApiarySetup();
    await onboarding.enterApiaryName('South Field');
    await onboarding.clickNext();

    // Goal Selection
    await onboarding.assertOnGoalSelection();
    await onboarding.selectGoal('honey');
    await onboarding.voiceFirstMode.click();
    await onboarding.clickNext();

    // Catchup Assessment — should appear because Melbourne = mid-season
    await onboarding.assertOnCatchupAssessment();
    await expect(page.getByText(/joining mid-season/i)).toBeVisible();
    // Check some baseline items
    await onboarding.catchupCheckbox('queenPresentAndLaying').click();
    await onboarding.catchupCheckbox('colonyStrengthModerateOrStrong').click();
    await onboarding.clickNext();

    // Disclaimer
    await onboarding.assertOnDisclaimer();
    await onboarding.acceptDisclaimer();
    await onboarding.clickNext();

    // Summary — verify southern hemisphere selections
    // Use .last() because previous screens remain hidden in the SPA DOM
    await onboarding.assertOnSummary();
    await expect(page.getByText('Sideliner').last()).toBeVisible();
    await expect(page.getByText('Melbourne').last()).toBeVisible();
    await expect(page.getByText(/fall/i).last()).toBeVisible();
    await expect(page.getByText('South Field').last()).toBeVisible();
    await expect(page.getByText(/Honey Production/).last()).toBeVisible();
    await expect(page.getByText(/Voice First/).last()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Form Validation
// ---------------------------------------------------------------------------
test.describe('Form Validation', () => {
  test('experience level: next disabled without selection', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'experience');
    await expect(onboarding.nextButton).toBeDisabled();

    await onboarding.selectExperienceLevel('newbie');
    await expect(onboarding.nextButton).toBeEnabled();
  });

  test('region setup: next disabled with empty input', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'region');
    await expect(onboarding.nextButton).toBeDisabled();

    await onboarding.enterRegion('Portland');
    await expect(onboarding.nextButton).toBeEnabled();
  });

  test('apiary setup: next disabled with empty name', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'apiary');
    await expect(onboarding.nextButton).toBeDisabled();

    await onboarding.enterApiaryName('My Apiary');
    await expect(onboarding.nextButton).toBeEnabled();
  });

  test('goal selection: next disabled without any goal', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'goals');
    // Select mode but no goal
    await onboarding.tapAndReadMode.click();
    await expect(onboarding.nextButton).toBeDisabled();
  });

  test('goal selection: next disabled without interaction mode', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'goals');
    // Select goal but no mode
    await onboarding.selectGoal('health');
    await expect(onboarding.nextButton).toBeDisabled();
  });

  test('goal selection: next enabled with goal and mode', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'goals');
    await onboarding.selectGoal('health');
    await onboarding.voiceFirstMode.click();
    await expect(onboarding.nextButton).toBeEnabled();
  });

  test('disclaimer: next disabled without acceptance', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'disclaimer');
    await expect(onboarding.nextButton).toBeDisabled();

    await onboarding.acceptDisclaimer();
    await expect(onboarding.nextButton).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Hive Count Stepper
// ---------------------------------------------------------------------------
test.describe('Hive Count Stepper', () => {
  test('starts at 1, increment increases, decrement decreases, min boundary at 1', async ({
    page,
    context,
  }) => {
    const onboarding = await navigateToScreen(page, context, 'apiary');
    await onboarding.enterApiaryName('Test');

    // Starts at 1
    await expect(onboarding.hiveCountDisplay).toHaveText('1');
    // Decrement disabled at minimum
    await expect(onboarding.hiveDecrementButton).toBeDisabled();

    // Increment to 3
    await onboarding.hiveIncrementButton.click();
    await onboarding.hiveIncrementButton.click();
    await expect(onboarding.hiveCountDisplay).toHaveText('3');
    // Decrement now enabled
    await expect(onboarding.hiveDecrementButton).toBeEnabled();

    // Decrement back to 2
    await onboarding.hiveDecrementButton.click();
    await expect(onboarding.hiveCountDisplay).toHaveText('2');
  });
});

// ---------------------------------------------------------------------------
// Goal Multi-Select
// ---------------------------------------------------------------------------
test.describe('Goal Multi-Select', () => {
  test('can select and deselect multiple goals', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'goals');

    // Select two goals
    await onboarding.selectGoal('health');
    await onboarding.selectGoal('honey');

    // Deselect health by clicking again
    await onboarding.selectGoal('health');

    // Select a third
    await onboarding.selectGoal('growth');

    // Select mode to enable next
    await onboarding.tapAndReadMode.click();
    await expect(onboarding.nextButton).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// Progress Indicator
// ---------------------------------------------------------------------------
test.describe('Progress Indicator', () => {
  test('progress dots update aria-label across screens', async ({ page, context }) => {
    const onboarding = await navigateToScreen(page, context, 'experience');

    // Step 2: Experience Level
    await expect(onboarding.progressDots).toHaveAttribute('aria-label', 'Step 2 of 7');

    await onboarding.selectExperienceLevel('newbie');
    await onboarding.clickNext();

    // Step 3: Region Setup
    await expect(onboarding.progressDots).toHaveAttribute('aria-label', 'Step 3 of 7');

    await onboarding.enterRegion('Portland');
    await onboarding.clickNext();

    // Step 4: Apiary Setup
    await expect(onboarding.progressDots).toHaveAttribute('aria-label', 'Step 4 of 7');

    await onboarding.enterApiaryName('Test');
    await onboarding.clickNext();

    // Step 5: Goal Selection
    await expect(onboarding.progressDots).toHaveAttribute('aria-label', 'Step 5 of 7');
  });
});

// ---------------------------------------------------------------------------
// Offline Bypass Behavior (FR48)
// ---------------------------------------------------------------------------
test.describe('Offline Bypass', () => {
  test('online shows auth buttons, offline shows continue-offline button', async ({
    page,
    context,
  }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    await welcome.clickGetStarted();

    const onboarding = new OnboardingPage(page);
    await onboarding.assertOnCreateAccount();

    // Online: auth buttons visible, offline-continue not visible
    await expect(onboarding.googleSignInButton).toBeVisible();
    await expect(onboarding.appleSignInButton).toBeVisible();
    await expect(onboarding.offlineContinueButton).not.toBeVisible();

    // Go offline
    await goOffline(page, context);
    await expect(onboarding.offlineContinueButton).toBeVisible({ timeout: 10_000 });

    // Offline: auth buttons hidden, offline-continue visible
    await expect(onboarding.googleSignInButton).not.toBeVisible();
    await expect(onboarding.appleSignInButton).not.toBeVisible();
    await expect(onboarding.offlineContinueButton).toBeVisible();
  });
});
