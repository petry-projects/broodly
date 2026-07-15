import type { Apiary, HiveStatus } from '@broodly/graphql-types';

// We test the computation logic directly by extracting it
// The hook itself wraps useApiaries which is mocked in screen tests
import { deriveApiaryHealth } from '../../apiary/utils/health-status';

function makeApiary(name: string, hiveStatuses: string[]): Apiary {
  return {
    id: name.toLowerCase(),
    name,
    region: 'Test',
    hives: hiveStatuses.map((status, i) => ({
      id: `hive-${i}`,
      name: `Hive ${i}`,
      status,
      type: 'LANGSTROTH',
      notes: '',
      createdAt: '',
      updatedAt: '',
      apiary: {} as Apiary,
    })),
    elevationOffset: 0,
    bloomOffset: 0,
    createdAt: '',
    updatedAt: '',
  } as Apiary;
}

describe('Dashboard summary computation', () => {
  it('sorts apiaries by priority: critical first', () => {
    const apiaries = [
      makeApiary('Healthy Yard', ['ACTIVE', 'ACTIVE']),
      makeApiary('Critical Yard', ['DEAD']),
      makeApiary('Attention Yard', ['INACTIVE']),
    ];

    const healths = apiaries.map((a) => ({
      name: a.name,
      health: deriveApiaryHealth(a.hives.map((h) => h.status as HiveStatus)),
    }));

    healths.sort((a, b) => {
      const order = { critical: 0, warning: 1, attention: 2, healthy: 3 };
      return order[a.health] - order[b.health];
    });

    expect(healths[0].name).toBe('Critical Yard');
    expect(healths[1].name).toBe('Attention Yard');
    expect(healths[2].name).toBe('Healthy Yard');
  });

  it('counts status categories correctly', () => {
    const apiaries = [
      makeApiary('A', ['ACTIVE']),
      makeApiary('B', ['ACTIVE']),
      makeApiary('C', ['DEAD']),
      makeApiary('D', ['INACTIVE']),
    ];

    const counts = { healthy: 0, attention: 0, warning: 0, critical: 0 };
    for (const a of apiaries) {
      const h = deriveApiaryHealth(a.hives.map((hive) => hive.status as HiveStatus));
      counts[h]++;
    }

    expect(counts.healthy).toBe(2);
    expect(counts.critical).toBe(1);
    expect(counts.attention).toBe(1);
  });

  it('counts hives needing attention per apiary', () => {
    const apiary = makeApiary('Mixed', ['ACTIVE', 'DEAD', 'INACTIVE', 'ACTIVE']);
    const needsAttention = apiary.hives.filter((h) => h.status !== 'ACTIVE').length;
    expect(needsAttention).toBe(2);
  });
});
