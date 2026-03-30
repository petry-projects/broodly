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

  // Start the Expo web dev server for e2e tests.
  // Dev server uses the correct expo-router entry point via package.json
  // "main" field. Set CI=1 for non-interactive mode.
  webServer: {
    command: `cd ${require('path').resolve(__dirname, '../apps/mobile')} && CI=1 npx expo start --web --port ${WEB_PORT}`,
    port: WEB_PORT,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    env: {
      ...process.env,
      CI: '1',
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
