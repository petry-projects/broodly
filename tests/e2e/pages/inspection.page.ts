import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class InspectionPage extends BasePage {
  // Entry screen
  get fullInspectionOption() {
    return this.byTestId('type-full');
  }

  get quickInspectionOption() {
    return this.byTestId('type-quick');
  }

  get startButton() {
    return this.byTestId('start-btn');
  }

  get resumeButton() {
    return this.byTestId('resume-btn');
  }

  // Step screen
  get nextButton() {
    return this.byTestId('next-btn');
  }

  get pauseButton() {
    return this.byTestId('pause-btn');
  }

  get observationInput() {
    return this.byTestId('observation-input');
  }

  option(id: string) {
    return this.byTestId(`option-${id}`);
  }

  get progressText() {
    return this.byText(/Step \d+ of \d+/);
  }

  // Summary screen
  get saveButton() {
    return this.byTestId('save-btn');
  }

  async assertOnEntry() {
    await expect(this.byText(/Start Inspection/)).toBeVisible();
  }

  async assertOnStep() {
    await expect(this.progressText).toBeVisible();
  }

  async assertOnSummary() {
    await expect(this.byText(/Inspection Complete/)).toBeVisible();
  }

  async selectFullInspection() {
    await this.fullInspectionOption.click();
  }

  async selectQuickInspection() {
    await this.quickInspectionOption.click();
  }

  async beginInspection() {
    await this.startButton.click();
    await this.waitForNavigation();
  }

  async selectOption(optionId: string) {
    await this.option(optionId).click();
  }

  async advanceStep() {
    await this.nextButton.click();
    // Allow time for store update and re-render
    await this.page.waitForTimeout(300);
  }

  async pauseInspection() {
    await this.pauseButton.click();
    await this.waitForNavigation();
  }

  async saveInspection() {
    await this.saveButton.click();
    await this.waitForNavigation();
  }
}
