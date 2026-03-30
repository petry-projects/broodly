import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class WelcomePage extends BasePage {
  get getStartedButton() {
    return this.byTestId('get-started-btn');
  }

  get signInButton() {
    return this.byTestId('sign-in-btn');
  }

  get heading() {
    return this.byText(/Broodly|Welcome/);
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForAuthReady();
  }

  async assertVisible() {
    await this.assertNoCrash();
    await expect(this.heading).toBeVisible({ timeout: 10_000 });
  }

  async clickGetStarted() {
    await this.getStartedButton.click();
    await this.waitForNavigation();
  }

  async clickSignIn() {
    await this.signInButton.click();
    await this.waitForNavigation();
  }
}
