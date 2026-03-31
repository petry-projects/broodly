import { HiveStatus } from '@broodly/graphql-types';
import { deriveApiaryHealth, deriveHiveHealth, HEALTH_BADGE_CONFIG } from './health-status';

describe('deriveHiveHealth', () => {
  it('maps ACTIVE to healthy', () => {
    expect(deriveHiveHealth(HiveStatus.Active)).toBe('healthy');
  });

  it('maps INACTIVE to attention', () => {
    expect(deriveHiveHealth(HiveStatus.Inactive)).toBe('attention');
  });

  it('maps DEAD to critical', () => {
    expect(deriveHiveHealth(HiveStatus.Dead)).toBe('critical');
  });

  it('maps SOLD to attention', () => {
    expect(deriveHiveHealth(HiveStatus.Sold)).toBe('attention');
  });
});

describe('deriveApiaryHealth', () => {
  it('returns healthy for empty hive list', () => {
    expect(deriveApiaryHealth([])).toBe('healthy');
  });

  it('returns healthy when all hives are ACTIVE', () => {
    expect(deriveApiaryHealth([HiveStatus.Active, HiveStatus.Active])).toBe('healthy');
  });

  it('returns worst-case status: critical if any DEAD', () => {
    expect(deriveApiaryHealth([HiveStatus.Active, HiveStatus.Dead, HiveStatus.Active])).toBe('critical');
  });

  it('returns attention if mixed ACTIVE and INACTIVE', () => {
    expect(deriveApiaryHealth([HiveStatus.Active, HiveStatus.Inactive])).toBe('attention');
  });
});

describe('HEALTH_BADGE_CONFIG', () => {
  it('maps healthy to success action with checkmark icon', () => {
    expect(HEALTH_BADGE_CONFIG.healthy.action).toBe('success');
    expect(HEALTH_BADGE_CONFIG.healthy.icon).toBe('checkmark-circle');
    expect(HEALTH_BADGE_CONFIG.healthy.bgClass).toBe('bg-background-success');
  });

  it('maps attention to warning action with outline variant and info icon', () => {
    expect(HEALTH_BADGE_CONFIG.attention.action).toBe('warning');
    expect(HEALTH_BADGE_CONFIG.attention.variant).toBe('outline');
    expect(HEALTH_BADGE_CONFIG.attention.icon).toBe('information-circle');
  });

  it('maps warning to warning action with solid variant and alert icon', () => {
    expect(HEALTH_BADGE_CONFIG.warning.action).toBe('warning');
    expect(HEALTH_BADGE_CONFIG.warning.variant).toBe('solid');
    expect(HEALTH_BADGE_CONFIG.warning.icon).toBe('alert-circle');
  });

  it('maps critical to error action with warning icon', () => {
    expect(HEALTH_BADGE_CONFIG.critical.action).toBe('error');
    expect(HEALTH_BADGE_CONFIG.critical.icon).toBe('warning');
    expect(HEALTH_BADGE_CONFIG.critical.bgClass).toBe('bg-background-error');
  });

  it('every status has icon, label, and bgClass (never color alone)', () => {
    for (const status of ['healthy', 'attention', 'warning', 'critical'] as const) {
      const config = HEALTH_BADGE_CONFIG[status];
      expect(config.icon).toBeTruthy();
      expect(config.label).toBeTruthy();
      expect(config.bgClass).toBeTruthy();
    }
  });
});
