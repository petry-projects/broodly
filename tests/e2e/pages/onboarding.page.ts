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

  get offlineContinueButton() {
    return this.byTestId('offline-continue');
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
    return this.byTestId('name-input');
  }

  // Goal Selection screen
  goalOption(id: string) {
    return this.byTestId(`goal-${id}`);
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
  get nextButton() {
    return this.byTestId('next-btn');
  }

  get progressDots() {
    return this.byTestId('progress-dots');
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
    await expect(this.byText(/Name your apiary/i)).toBeVisible();
  }

  async assertOnGoalSelection() {
    await expect(this.byText(/What are your goals/)).toBeVisible();
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
