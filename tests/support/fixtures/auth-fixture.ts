import { test as base } from '@playwright/test';

type AuthFixture = {
  /**
   * Get a Firebase ID token for the test user.
   * Uses the Firebase Auth REST API with a test account.
   *
   * Requires env vars:
   * - FIREBASE_API_KEY
   * - TEST_USER_EMAIL (Firebase test user)
   * - TEST_USER_PASSWORD (Firebase test user)
   */
  authToken: string;
};

export const test = base.extend<AuthFixture>({
  authToken: async ({ request }, use) => {
    const apiKey = process.env.FIREBASE_API_KEY;
    const email = process.env.TEST_USER_EMAIL;
    const password = process.env.TEST_USER_PASSWORD;

    if (!apiKey || !email || !password) {
      // Fall back to empty token — tests requiring auth should skip
      await use('');
      return;
    }

    const response = await request.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        data: {
          email,
          password,
          returnSecureToken: true,
        },
      },
    );

    const body = await response.json();
    await use(body.idToken ?? '');
  },
});
