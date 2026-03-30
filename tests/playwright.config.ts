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

  // Auto-start Expo web dev server for e2e tests
  webServer: {
    command: 'pnpm --filter mobile run web -- --port 8081',
    port: WEB_PORT,
    cwd: '..',
    timeout: 60_000,
    reuseExistingServer: !process.env.CI,
    env: {
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
