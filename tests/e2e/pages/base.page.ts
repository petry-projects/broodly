import { type Page, type Locator, expect } from '@playwright/test';

/**
 * Base page object with shared helpers for Expo web app testing.
 *
 * Expo Router renders React Native components to web using react-native-web.
 * Elements use `testID` prop which maps to `data-testid` in the DOM.
 * Text content is rendered in nested spans/divs — use text selectors carefully.
 */
export class BasePage {
  constructor(protected page: Page) {}

  /** Locate an element by its testID prop (maps to data-testid in web) */
  byTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /** Locate by accessible role and name (most resilient selector) */
  byRole(role: string, options?: { name?: string | RegExp }): Locator {
    return this.page.getByRole(role as Parameters<Page['getByRole']>[0], options);
  }

  /** Locate by visible text content */
  byText(text: string | RegExp): Locator {
    return this.page.getByText(text);
  }

  /** Wait for the auth loading spinner to disappear */
  async waitForAuthReady(): Promise<void> {
    // AuthGuard shows a loading spinner with testID="auth-loading"
    // Wait for it to either not exist or disappear
    const spinner = this.byTestId('auth-loading');
    await spinner.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {
      // Spinner may never appear if auth resolves instantly
    });
  }

  /** Wait for navigation to settle (Expo Router transitions) */
  async waitForNavigation(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /** Assert no crash errors visible on page */
  async assertNoCrash(): Promise<void> {
    await expect(this.byText(/SyntaxError/)).not.toBeVisible();
    await expect(this.byText(/Unhandled Runtime Error/)).not.toBeVisible();
    await expect(this.byText(/Cannot use/)).not.toBeVisible();
  }
}
