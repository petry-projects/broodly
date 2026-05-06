import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const mobileRoot = resolve(__dirname, '..');
const envExamplePath = join(mobileRoot, '.env.example');

describe('.env.example', () => {
  it('exists in apps/mobile/', () => {
    expect(existsSync(envExamplePath)).toBe(true);
  });

  it('documents every EXPO_PUBLIC_ variable referenced in source code', () => {
    const srcDir = resolve(mobileRoot, 'src');
    const envContent = readFileSync(envExamplePath, 'utf-8');
    const expoVarPattern = /EXPO_PUBLIC_[A-Z_]+/g;

    function scanDir(dir: string): string[] {
      if (!existsSync(dir)) return [];
      const vars: string[] = [];
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          vars.push(...scanDir(fullPath));
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          const matches = readFileSync(fullPath, 'utf-8').match(expoVarPattern) ?? [];
          vars.push(...matches);
        }
      }
      return vars;
    }

    const sourceVars = [...new Set(scanDir(srcDir))];

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
    // At least one section header comment per variable group (we currently have ~4 groups).
    expect(commentLines.length).toBeGreaterThanOrEqual(4);
  });
});
