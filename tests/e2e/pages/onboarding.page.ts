import { type Page, expect } from '@playwright/test';
import { BasePage } from './base.page';

export class OnboardingPage extends BasePage {
  // Create Account screen
  get tosCheckbox() {
    return this.byTestId('tos-checkbox');
  }

  get googleSignInButton() {
    return this.byTestId('google-sign-in');
  }

  get appleSignInButton() {
    return this.byTestId('apple-sign-in');
  }

  get offlineContinueButton() {
    return this.byTestId('offline-continue');
  }

  /** Auth error alert — matches [role="alert"] containing error message text */
  get authErrorAlert() {
    return this.page.locator('[role="alert"]').filter({
      hasText: /try again|went wrong|cancelled|timed out|failed/i,
    });
  }

  // Experience Level screen
  experienceLevelOption(level: string) {
    return this.byTestId(`level-${level}`);
  }

  // Region screen
  get regionInput() {
    return this.byTestId('region-input');
  }

  // Apiary Setup screen
  get apiaryNameInput() {
    return this.byTestId('apiary-name-input');
  }

  get hiveIncrementButton() {
    return this.byTestId('hive-increment');
  }

  get hiveDecrementButton() {
    return this.byTestId('hive-decrement');
  }

  get hiveCountDisplay() {
    return this.byTestId('hive-count');
  }

  // Goal Selection screen
  goalOption(id: string) {
    return this.byTestId(`goal-${id}`);
  }

  get voiceFirstMode() {
    return this.byTestId('mode-voice_first');
  }

  get tapAndReadMode() {
    return this.byTestId('mode-tap_and_read');
  }

  // Catchup Assessment screen
  catchupCheckbox(key: string) {
    return this.byTestId(`check-${key}`);
  }

  // Disclaimer screen
  get disclaimerCheckbox() {
    return this.byTestId('disclaimer-checkbox');
  }

  // Summary screen
  get completeButton() {
    return this.byTestId('complete-btn');
  }

  // Shared
  /** Returns the active screen's next button (last in DOM, since Expo Router keeps previous screens hidden) */
  get nextButton() {
    return this.byTestId('next-btn').last();
  }

  /** Returns the active screen's progress dots (last in DOM for SPA) */
  get progressDots() {
    return this.byTestId('progress-dots').last();
  }

  async assertOnCreateAccount() {
    await expect(this.byText(/Create your account/)).toBeVisible();
  }

  async assertOnExperienceLevel() {
    await expect(this.byText(/experience level/i)).toBeVisible();
  }

  async assertOnRegionSetup() {
    await expect(this.byText(/Where are your bees/)).toBeVisible();
  }

  async assertOnApiarySetup() {
    await expect(this.byText(/Set up your first apiary/i)).toBeVisible();
  }

  async assertOnGoalSelection() {
    await expect(this.byText(/What are your goals/)).toBeVisible();
  }

  async assertOnCatchupAssessment() {
    await expect(this.byText(/Quick catch-up/)).toBeVisible();
  }

  async assertOnDisclaimer() {
    await expect(this.byText(/Advisory-Only Guidance/)).toBeVisible();
  }

  async assertOnSummary() {
    await expect(this.byText(/You are all set/i)).toBeVisible();
  }

  async acceptTos() {
    await this.tosCheckbox.click();
  }

  async selectExperienceLevel(level: 'newbie' | 'amateur' | 'sideliner') {
    await this.experienceLevelOption(level).click();
  }

  async enterRegion(region: string) {
    await this.regionInput.fill(region);
  }

  async enterApiaryName(name: string) {
    await this.apiaryNameInput.fill(name);
  }

  async selectGoal(goalId: string) {
    await this.goalOption(goalId).click();
  }

  async acceptDisclaimer() {
    await this.disclaimerCheckbox.click();
  }

  async clickNext() {
    await this.nextButton.click();
    await this.waitForNavigation();
  }

  async completeOnboarding() {
    await this.completeButton.click();
    await this.waitForNavigation();
  }
}
