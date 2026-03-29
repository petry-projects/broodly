import { deriveApiaryHealth, deriveHiveHealth, HEALTH_BADGE_CONFIG } from './health-status';

describe('deriveHiveHealth', () => {
  it('maps ACTIVE to healthy', () => {
    expect(deriveHiveHealth('ACTIVE')).toBe('healthy');
  });

  it('maps INACTIVE to attention', () => {
    expect(deriveHiveHealth('INACTIVE')).toBe('attention');
  });

  it('maps DEAD to critical', () => {
    expect(deriveHiveHealth('DEAD')).toBe('critical');
  });

  it('maps SOLD to attention', () => {
    expect(deriveHiveHealth('SOLD')).toBe('attention');
  });
});

describe('deriveApiaryHealth', () => {
  it('returns healthy for empty hive list', () => {
    expect(deriveApiaryHealth([])).toBe('healthy');
  });

  it('returns healthy when all hives are ACTIVE', () => {
    expect(deriveApiaryHealth(['ACTIVE', 'ACTIVE'])).toBe('healthy');
  });

  it('returns worst-case status: critical if any DEAD', () => {
    expect(deriveApiaryHealth(['ACTIVE', 'DEAD', 'ACTIVE'])).toBe('critical');
  });

  it('returns attention if mixed ACTIVE and INACTIVE', () => {
    expect(deriveApiaryHealth(['ACTIVE', 'INACTIVE'])).toBe('attention');
  });
});

describe('HEALTH_BADGE_CONFIG', () => {
  it('maps healthy to success action', () => {
    expect(HEALTH_BADGE_CONFIG.healthy.action).toBe('success');
  });

  it('maps attention to warning action with outline variant', () => {
    expect(HEALTH_BADGE_CONFIG.attention.action).toBe('warning');
    expect(HEALTH_BADGE_CONFIG.attention.variant).toBe('outline');
  });

  it('maps warning to warning action with solid variant', () => {
    expect(HEALTH_BADGE_CONFIG.warning.action).toBe('warning');
    expect(HEALTH_BADGE_CONFIG.warning.variant).toBe('solid');
  });

  it('maps critical to error action', () => {
    expect(HEALTH_BADGE_CONFIG.critical.action).toBe('error');
  });
});
