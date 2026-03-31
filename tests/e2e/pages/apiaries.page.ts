import { expect } from '@playwright/test';
import { BasePage } from './base.page';

export class ApiariesPage extends BasePage {
  get addApiaryButton() {
    return this.byTestId('add-apiary-btn');
  }

  get emptyStateText() {
    return this.byText(/No apiaries/i);
  }

  get heading() {
    return this.byText(/My Apiaries|Apiaries/);
  }

  get loadingText() {
    return this.byText(/Loading apiaries/i);
  }

  apiaryCard(id: string) {
    return this.byTestId(`apiary-card-${id}`);
  }

  // Create Apiary form
  get nameInput() {
    return this.byTestId('name-input');
  }

  get regionInput() {
    return this.byTestId('region-input');
  }

  get notesInput() {
    return this.byTestId('notes-input');
  }

  get createButton() {
    return this.byTestId('create-btn');
  }

  async goto() {
    await this.page.goto('/apiaries');
    await this.waitForAuthReady();
  }

  async assertVisible() {
    await this.assertNoCrash();
    // Either shows heading, empty state, or loading
    const heading = this.heading;
    const empty = this.emptyStateText;
    const loading = this.loadingText;
    await expect(heading.or(empty).or(loading)).toBeVisible({ timeout: 10_000 });
  }

  async assertEmptyState() {
    await expect(this.emptyStateText).toBeVisible();
    await expect(this.addApiaryButton).toBeVisible();
  }

  async clickAddApiary() {
    await this.addApiaryButton.click();
    await this.waitForNavigation();
  }

  async fillCreateForm(name: string, region: string, notes?: string) {
    await this.nameInput.fill(name);
    await this.regionInput.fill(region);
    if (notes) {
      await this.notesInput.fill(notes);
    }
  }

  async submitCreateForm() {
    await this.createButton.click();
    await this.waitForNavigation();
  }
}
