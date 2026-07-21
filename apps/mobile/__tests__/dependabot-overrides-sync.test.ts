// Use require() for Node built-ins so this file works under Jest's module resolver.
const { readFileSync } = require('fs');
const { resolve } = require('path');

// Repo root, resolved from apps/mobile/__tests__.
const REPO_ROOT: string = resolve(__dirname, '../../..');

/**
 * Extract the bare package name from a pnpm override key.
 * Override keys may carry a version selector, e.g.
 *   "@tootallnate/once@<3.0.1" -> "@tootallnate/once"
 *   "lodash@>=4.0.0 <=4.17.23" -> "lodash"
 *   "@babel/core"              -> "@babel/core"
 */
function overrideKeyToPackageName(rawKey: string): string {
  const key = rawKey.trim().replace(/^['"]|['"]$/g, '');
  // For scoped packages the separating '@' is the one after index 0.
  const searchFrom = key.startsWith('@') ? 1 : 0;
  const at = key.indexOf('@', searchFrom);
  return at === -1 ? key : key.slice(0, at);
}

/** Parse the `overrides:` block of pnpm-workspace.yaml into a set of package names. */
function parseOverridePackages(): Set<string> {
  const text = readFileSync(resolve(REPO_ROOT, 'pnpm-workspace.yaml'), 'utf8');
  const lines = text.split('\n');
  const packages = new Set<string>();

  let inOverrides = false;
  for (const line of lines) {
    if (/^overrides:\s*$/.test(line)) {
      inOverrides = true;
      continue;
    }
    if (inOverrides) {
      // Block ends at the next top-level (non-indented, non-empty) key.
      if (line.trim() !== '' && !/^\s/.test(line)) break;
      if (line.trim() === '') continue;

      const trimmed = line.trim();
      if (trimmed.startsWith('#')) continue;

      let key: string;
      if (trimmed.startsWith("'") || trimmed.startsWith('"')) {
        const quote = trimmed[0];
        const endQuoteIndex = trimmed.indexOf(quote, 1);
        if (endQuoteIndex === -1) continue;
        key = trimmed.slice(1, endQuoteIndex);
      } else {
        const colonIndex = trimmed.indexOf(':');
        if (colonIndex === -1) continue;
        key = trimmed.slice(0, colonIndex);
      }
      packages.add(overrideKeyToPackageName(key));
    }
  }
  return packages;
}

/** Parse the npm ecosystem `ignore:` list of .github/dependabot.yml into a set of package names. */
function parseIgnoredPackages(): Set<string> {
  const text = readFileSync(resolve(REPO_ROOT, '.github/dependabot.yml'), 'utf8');
  const packages = new Set<string>();

  // Scope parsing to the npm ecosystem block to avoid false matches from
  // gomod, terraform, or other ecosystems that may have their own ignore lists.
  const npmIndex = text.indexOf('package-ecosystem: "npm"');
  if (npmIndex === -1) return packages;

  const nextEcosystemIndex = text.indexOf('- package-ecosystem:', npmIndex + 24);
  const npmBlock = nextEcosystemIndex === -1
    ? text.slice(npmIndex)
    : text.slice(npmIndex, nextEcosystemIndex);

  const re = /dependency-name:\s*['"]?([^'"\n]+?)['"]?\s*$/gm;
  let match: RegExpExecArray | null;
  while ((match = re.exec(npmBlock)) !== null) {
    packages.add(match[1].trim());
  }
  return packages;
}

describe('Dependabot ignore list stays in sync with pnpm overrides', () => {
  const overridePackages = parseOverridePackages();
  const ignoredPackages = parseIgnoredPackages();

  it('parses a non-empty override set', () => {
    expect(overridePackages.size).toBeGreaterThan(0);
  });

  it('ignores every override-remediated dependency in dependabot.yml', () => {
    // Dependabot cannot process pnpm overrides, so every override-pinned
    // dependency must be ignored or its security-update job fails
    // (security_update_not_possible / all_versions_ignored).
    const missing = [...overridePackages].filter((p) => !ignoredPackages.has(p)).sort();
    expect(missing).toEqual([]);
  });

  it('has no stale ignore entries without a matching override', () => {
    const extra = [...ignoredPackages].filter((p) => !overridePackages.has(p)).sort();
    expect(extra).toEqual([]);
  });
});
