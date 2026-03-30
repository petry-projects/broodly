import { defineConfig, devices } from '@playwright/test';

const WEB_PORT = 8081;
const API_PORT = 8080;

export default defineConfig({
  testDir: '.',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  fullyParallel: true,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: '../_bmad-output/test-artifacts/playwright-report' }],
  ],

  use: {
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
  },

  // Build and serve the Expo web app for e2e tests.
  // Uses production build (expo export) because the Hermes dev bundler
  // has import.meta compatibility issues with ESM deps. The exported
  // static site is served via npx serve.
  webServer: {
    command: [
      `cd ${require('path').resolve(__dirname, '../apps/mobile')}`,
      'npx expo export --platform web 2>/dev/null',
      `npx serve dist -l ${WEB_PORT} -s --no-clipboard`,
    ].join(' && '),
    port: WEB_PORT,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    env: {
      ...process.env,
      EXPO_USE_METRO_REQUIRE: '1',
      EXPO_PUBLIC_FIREBASE_USE_EMULATOR: 'true',
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: 'broodly-dev',
      EXPO_PUBLIC_FIREBASE_API_KEY: 'fake-api-key',
    },
  },

  projects: [
    {
      name: 'api',
      testDir: './api',
      use: {
        baseURL: `http://localhost:${API_PORT}`,
        extraHTTPHeaders: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'e2e-chromium',
      testDir: './e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: `http://localhost:${WEB_PORT}`,
      },
    },
    {
      name: 'e2e-mobile',
      testDir: './e2e',
      use: {
        ...devices['iPhone 14'],
        baseURL: `http://localhost:${WEB_PORT}`,
      },
    },
  ],
});
