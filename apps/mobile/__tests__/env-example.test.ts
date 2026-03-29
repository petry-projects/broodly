import { readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { execSync } from 'child_process';

const mobileRoot = resolve(__dirname, '..');
const envExamplePath = join(mobileRoot, '.env.example');

describe('.env.example', () => {
  it('exists in apps/mobile/', () => {
    expect(existsSync(envExamplePath)).toBe(true);
  });

  it('documents every EXPO_PUBLIC_ variable referenced in source code', () => {
    const grepOutput = execSync(
      'grep -roh "EXPO_PUBLIC_[A-Z_]*" src/ --include="*.ts" --include="*.tsx" 2>/dev/null || true',
      { cwd: mobileRoot, encoding: 'utf-8' },
    );

    const sourceVars = [
      ...new Set(
        grepOutput
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean),
      ),
    ];

    const envContent = readFileSync(envExamplePath, 'utf-8');

    for (const varName of sourceVars) {
      expect(envContent).toContain(varName);
    }
  });

  it('has section header comments explaining variable groups', () => {
    const content = readFileSync(envExamplePath, 'utf-8');
    const lines = content.split('\n');

    const commentLines = lines.filter((l) => l.trim().startsWith('#'));
    const varLines = lines.filter((l) => l.trim() && !l.trim().startsWith('#') && l.includes('='));

    expect(varLines.length).toBeGreaterThan(0);
    // At least one comment per variable group (we have ~4 sections)
    expect(commentLines.length).toBeGreaterThanOrEqual(varLines.length);
  });
});
