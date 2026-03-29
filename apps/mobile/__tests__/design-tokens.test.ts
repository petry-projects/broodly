jest.mock('nativewind', () => ({
  vars: (input: Record<string, string>) => input,
}));

import { lightTokens } from '../components/ui/gluestack-ui-provider/config';

/**
 * Tests that the Broodly design token configuration contains all required
 * color scales and semantic tokens per the design system specification.
 */
describe('Broodly Design Token Configuration', () => {
  const tokens = lightTokens;

  const requiredScales = [
    'primary',
    'secondary',
    'success',
    'warning',
    'error',
    'info',
    'typography',
    'background',
    'outline',
  ] as const;

  const requiredShades = [
    '0',
    '50',
    '100',
    '200',
    '300',
    '400',
    '500',
    '600',
    '700',
    '800',
    '900',
    '950',
  ] as const;

  it.each(requiredScales)(
    'contains all shades for %s color scale',
    (scale) => {
      for (const shade of requiredShades) {
        const key = `--color-${scale}-${shade}`;
        expect(tokens).toHaveProperty(key);
        const value = tokens[key];
        expect(value).toMatch(/^\d+ \d+ \d+$/);
      }
    }
  );

  it('contains semantic background tokens', () => {
    const semanticTokens = [
      '--color-background-error',
      '--color-background-warning',
      '--color-background-success',
      '--color-background-info',
      '--color-background-muted',
    ];

    for (const token of semanticTokens) {
      expect(tokens).toHaveProperty(token);
      const value = tokens[token];
      expect(value).toMatch(/^\d+ \d+ \d+$/);
    }
  });

  it('contains focus ring indicator tokens', () => {
    const indicators = [
      '--color-indicator-primary',
      '--color-indicator-info',
      '--color-indicator-error',
    ];

    for (const token of indicators) {
      expect(tokens).toHaveProperty(token);
    }
  });

  it('has correct key color values for Broodly brand', () => {
    const brandColors = tokens;

    // primary-500: #D4880F -> 212 136 15
    expect(brandColors['--color-primary-500']).toBe('212 136 15');

    // secondary-500: #E8B931 -> 232 185 49
    expect(brandColors['--color-secondary-500']).toBe('232 185 49');

    // success-500: #2D7A3A -> 45 122 58
    expect(brandColors['--color-success-500']).toBe('45 122 58');

    // warning-500: #B8720A -> 184 114 10
    expect(brandColors['--color-warning-500']).toBe('184 114 10');

    // error-500: #A63D2F -> 166 61 47
    expect(brandColors['--color-error-500']).toBe('166 61 47');

    // info-500: #4A90C4 -> 74 144 196
    expect(brandColors['--color-info-500']).toBe('74 144 196');

    // typography-500: #6B7280 -> 107 114 128
    expect(brandColors['--color-typography-500']).toBe('107 114 128');

    // typography-800: #2C2C2C -> 44 44 44
    expect(brandColors['--color-typography-800']).toBe('44 44 44');

    // background-0: #FFFFFF -> 255 255 255
    expect(brandColors['--color-background-0']).toBe('255 255 255');

    // background-50: #FDF6E8 -> 253 246 232
    expect(brandColors['--color-background-50']).toBe('253 246 232');

    // background-100: #FAFAF7 -> 250 250 247
    expect(brandColors['--color-background-100']).toBe('250 250 247');

    // outline-200: #E5E7EB -> 229 231 235
    expect(brandColors['--color-outline-200']).toBe('229 231 235');
  });

  it('has correct semantic background color values', () => {
    const brandColors = tokens;

    // background-error: #FEE2E2 -> 254 226 226
    expect(brandColors['--color-background-error']).toBe('254 226 226');

    // background-warning: #FFF3E0 -> 255 243 224
    expect(brandColors['--color-background-warning']).toBe('255 243 224');

    // background-success: #E8F5E9 -> 232 245 233
    expect(brandColors['--color-background-success']).toBe('232 245 233');

    // background-info: #E3F2FD -> 227 242 253
    expect(brandColors['--color-background-info']).toBe('227 242 253');

    // background-muted: #F3F4F6 -> 243 244 246
    expect(brandColors['--color-background-muted']).toBe('243 244 246');
  });
});
