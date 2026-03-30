import { test, expect } from '@playwright/test';

test.describe('Web Platform Compatibility', () => {
  test('no import.meta errors in bundled output', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(3000);

    const importMetaErrors = errors.filter((e) => e.includes('import.meta'));
    expect(importMetaErrors).toEqual([]);
  });

  test('native-only modules do not leak into web bundle', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(2000);

    // These modules should be blocked by Metro resolver for web
    const nativeLeaks = errors.filter(
      (e) =>
        e.includes('react-native-mmkv') ||
        e.includes('@react-native-firebase'),
    );
    expect(nativeLeaks).toEqual([]);
  });

  test('Gluestack UI renders without hydration errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForTimeout(2000);

    const hydrationErrors = errors.filter((e) => e.includes('Hydration'));
    expect(hydrationErrors).toEqual([]);
  });
});
