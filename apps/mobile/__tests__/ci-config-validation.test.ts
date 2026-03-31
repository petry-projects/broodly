import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const repoRoot = resolve(__dirname, '..', '..', '..');
const ciYmlPath = resolve(repoRoot, '.github', 'workflows', 'ci.yml');

describe('CI workflow configuration', () => {
  let ciContent: string;

  beforeAll(() => {
    ciContent = readFileSync(ciYmlPath, 'utf-8');
  });

  it('ci.yml exists', () => {
    expect(existsSync(ciYmlPath)).toBe(true);
  });

  it('has a TypeScript job', () => {
    expect(ciContent).toContain('typescript:');
  });

  it('has a Go job', () => {
    expect(ciContent).toContain('go:');
  });

  it('uses Firebase emulator env for TS tests', () => {
    expect(ciContent).toContain('EXPO_PUBLIC_FIREBASE_USE_EMULATOR');
    expect(ciContent).toMatch(/EXPO_PUBLIC_FIREBASE_USE_EMULATOR.*true/);
  });

  it('runs format check, lint, type check, and tests', () => {
    expect(ciContent).toContain('Format check');
    expect(ciContent).toContain('Lint');
    expect(ciContent).toContain('Type Check');
    expect(ciContent).toContain('Test with coverage');
  });

  it('has env generation step for mobile builds', () => {
    expect(ciContent).toContain('Generate .env from secrets');
  });

  it('has native Firebase config injection for Android', () => {
    expect(ciContent).toContain('Inject native Firebase config (Android)');
    expect(ciContent).toContain('google-services.json');
  });

  it('has native Firebase config injection for iOS', () => {
    expect(ciContent).toContain('Inject native Firebase config (iOS)');
    expect(ciContent).toContain('GoogleService-Info.plist');
  });

  it('pins all GitHub Actions to commit SHAs', () => {
    const usesLines = ciContent.split('\n').filter((l) => l.trim().startsWith('- uses:'));
    for (const line of usesLines) {
      // Each uses line should have a SHA comment like @abc123 # vN
      expect(line).toMatch(/@[0-9a-f]{40}/);
    }
  });

  it('uploads test artifacts on failure', () => {
    expect(ciContent).toContain('Upload test artifacts on failure');
  });
});
