import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class HomePage extends BasePage {
  get startPlanButton() {
    return this.byTestId('start-plan-btn');
  }

  get viewApiariesButton() {
    return this.byTestId('view-apiaries-btn');
  }

  get greeting() {
    return this.byText(/Hello|Welcome back/);
  }

  get weatherCard() {
    return this.byText('Weather');
  }

  get bloomCard() {
    return this.byText('Bloom Status');
  }

  get seasonCard() {
    return this.byText('Seasonal Phase');
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForAuthReady();
  }

  async assertVisible() {
    await this.assertNoCrash();
    await expect(this.greeting).toBeVisible({ timeout: 10_000 });
  }

  async assertContextCardsVisible() {
    await expect(this.weatherCard).toBeVisible();
    await expect(this.bloomCard).toBeVisible();
    await expect(this.seasonCard).toBeVisible();
  }

  async navigateToPlan() {
    await this.startPlanButton.click();
    await this.waitForNavigation();
  }

  async navigateToApiaries() {
    await this.viewApiariesButton.click();
    await this.waitForNavigation();
  }
}
