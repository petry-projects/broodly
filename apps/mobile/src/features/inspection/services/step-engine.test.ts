import { getPromptSequence, getNextPromptIndex, getTotalSteps } from './step-engine';
import type { Observation } from '../types';

describe('getPromptSequence', () => {
  it('returns full prompt set for full inspection', () => {
    const prompts = getPromptSequence('full', []);
    expect(prompts.length).toBeGreaterThanOrEqual(7);
    expect(prompts[0].id).toBe('entrance');
  });

  it('returns fewer prompts for quick inspection', () => {
    const full = getPromptSequence('full', []);
    const quick = getPromptSequence('quick', []);
    expect(quick.length).toBeLessThan(full.length);
  });

  it('includes minimum 5 required steps for quick inspection', () => {
    const quick = getPromptSequence('quick', []);
    expect(quick.length).toBeGreaterThanOrEqual(5);
  });

  it('inserts swarm_risk prompt when queen swarm cells observed', () => {
    const obs: Observation[] = [
      {
        id: '1',
        promptId: 'queen_cells',
        observationType: 'queen_cell_check',
        value: 'swarm',
        classification: 'urgent',
        createdAt: new Date().toISOString(),
      },
    ];
    const prompts = getPromptSequence('full', obs);
    const ids = prompts.map((p) => p.id);
    expect(ids).toContain('swarm_risk');
  });

  it('does not duplicate swarm_risk when no swarm cells observed', () => {
    const obs: Observation[] = [
      {
        id: '1',
        promptId: 'queen_cells',
        observationType: 'queen_cell_check',
        value: 'none',
        classification: 'normal',
        createdAt: new Date().toISOString(),
      },
    ];
    const prompts = getPromptSequence('full', obs);
    const ids = prompts.map((p) => p.id);
    // swarm_risk appears once in the base list but branching should not add a second copy
    const swarmCount = ids.filter((id) => id === 'swarm_risk').length;
    expect(swarmCount).toBe(1);
  });

  it('places swarm_risk immediately after queen_cells when swarm cells observed', () => {
    const obs: Observation[] = [
      {
        id: '1',
        promptId: 'queen_cells',
        observationType: 'queen_cell_check',
        value: 'swarm',
        classification: 'urgent',
        createdAt: new Date().toISOString(),
      },
    ];
    const prompts = getPromptSequence('full', obs);
    const queenIdx = prompts.findIndex((p) => p.id === 'queen_cells');
    const swarmIdx = prompts.findIndex((p) => p.id === 'swarm_risk');
    expect(swarmIdx).toBe(queenIdx + 1);
  });
});

describe('getNextPromptIndex', () => {
  it('returns next index when not at end', () => {
    const prompts = getPromptSequence('full', []);
    expect(getNextPromptIndex(0, prompts)).toBe(1);
  });

  it('returns null at the last prompt', () => {
    const prompts = getPromptSequence('full', []);
    expect(getNextPromptIndex(prompts.length - 1, prompts)).toBeNull();
  });
});

describe('getTotalSteps', () => {
  it('returns total count for full inspection', () => {
    const total = getTotalSteps('full', []);
    expect(total).toBeGreaterThanOrEqual(7);
  });

  it('returns fewer steps for quick inspection', () => {
    const full = getTotalSteps('full', []);
    const quick = getTotalSteps('quick', []);
    expect(quick).toBeLessThan(full);
  });
});
