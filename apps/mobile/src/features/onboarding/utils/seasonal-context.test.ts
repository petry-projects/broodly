import { resolveSeasonalContext, isMidSeason } from './seasonal-context';

describe('resolveSeasonalContext', () => {
  it('detects northern hemisphere for US region', () => {
    const ctx = resolveSeasonalContext('Pacific Northwest', new Date('2026-06-15'));
    expect(ctx.hemisphere).toBe('northern');
  });

  it('detects southern hemisphere for Australian region', () => {
    const ctx = resolveSeasonalContext('Melbourne, Australia', new Date('2026-06-15'));
    expect(ctx.hemisphere).toBe('southern');
  });

  it('returns summer for northern June', () => {
    const ctx = resolveSeasonalContext('Oregon', new Date('2026-06-15'));
    expect(ctx.season).toBe('summer');
  });

  it('returns winter for southern June', () => {
    const ctx = resolveSeasonalContext('Sydney', new Date('2026-06-15'));
    expect(ctx.season).toBe('winter');
  });

  it('returns spring for northern March', () => {
    const ctx = resolveSeasonalContext('London', new Date('2026-03-15'));
    expect(ctx.season).toBe('spring');
  });

  it('returns fall for northern October', () => {
    const ctx = resolveSeasonalContext('New York', new Date('2026-10-15'));
    expect(ctx.season).toBe('fall');
  });

  it('marks summer as mid-season', () => {
    const ctx = resolveSeasonalContext('Oregon', new Date('2026-07-15'));
    expect(ctx.isMidSeason).toBe(true);
  });

  it('marks fall as mid-season', () => {
    const ctx = resolveSeasonalContext('Oregon', new Date('2026-10-15'));
    expect(ctx.isMidSeason).toBe(true);
  });

  it('marks spring as not mid-season', () => {
    const ctx = resolveSeasonalContext('Oregon', new Date('2026-04-15'));
    expect(ctx.isMidSeason).toBe(false);
  });

  it('marks winter as not mid-season', () => {
    const ctx = resolveSeasonalContext('Oregon', new Date('2026-01-15'));
    expect(ctx.isMidSeason).toBe(false);
  });
});

describe('isMidSeason', () => {
  it('returns true for northern summer', () => {
    expect(isMidSeason('Oregon', new Date('2026-07-15'))).toBe(true);
  });

  it('returns false for northern spring', () => {
    expect(isMidSeason('Oregon', new Date('2026-04-15'))).toBe(false);
  });
});
