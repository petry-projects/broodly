import {
  FULL_INSPECTION_PROMPTS,
  getPromptsForType,
} from './prompt-tree';

describe('Inspection prompt tree', () => {
  describe('structure validation', () => {
    it('has at least 5 root prompts', () => {
      expect(FULL_INSPECTION_PROMPTS.length).toBeGreaterThanOrEqual(5);
    });

    it('every prompt has a unique id', () => {
      const ids = FULL_INSPECTION_PROMPTS.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every prompt has required fields', () => {
      for (const prompt of FULL_INSPECTION_PROMPTS) {
        expect(prompt.id).toBeTruthy();
        expect(prompt.title).toBeTruthy();
        expect(prompt.description).toBeTruthy();
        expect(prompt.compactLabel).toBeTruthy();
        expect(prompt.observationType).toBeTruthy();
        expect(typeof prompt.isRequired).toBe('boolean');
        expect(typeof prompt.quickMode).toBe('boolean');
      }
    });

    it('every option has valid classification', () => {
      const validClassifications = ['normal', 'cautionary', 'urgent'];
      for (const prompt of FULL_INSPECTION_PROMPTS) {
        if (prompt.options) {
          for (const option of prompt.options) {
            expect(validClassifications).toContain(option.classification);
            expect(option.id).toBeTruthy();
            expect(option.label).toBeTruthy();
          }
        }
      }
    });
  });

  describe('navigation paths are valid', () => {
    it('all nextPromptOverride references point to existing prompt ids', () => {
      const allIds = new Set(FULL_INSPECTION_PROMPTS.map((p) => p.id));
      for (const prompt of FULL_INSPECTION_PROMPTS) {
        if (prompt.options) {
          for (const option of prompt.options) {
            if (option.nextPromptOverride) {
              expect(allIds.has(option.nextPromptOverride)).toBe(true);
            }
          }
        }
      }
    });
  });

  describe('no orphan nodes', () => {
    it('every non-entry prompt is reachable from sequential order or via override', () => {
      const reachableIds = new Set<string>();

      // First prompt is always reachable (entry point)
      reachableIds.add(FULL_INSPECTION_PROMPTS[0].id);

      for (let i = 0; i < FULL_INSPECTION_PROMPTS.length; i++) {
        const prompt = FULL_INSPECTION_PROMPTS[i];

        // Next in sequence is reachable
        if (i + 1 < FULL_INSPECTION_PROMPTS.length) {
          reachableIds.add(FULL_INSPECTION_PROMPTS[i + 1].id);
        }

        // Override targets are reachable
        if (prompt.options) {
          for (const option of prompt.options) {
            if (option.nextPromptOverride) {
              reachableIds.add(option.nextPromptOverride);
            }
          }
        }
      }

      for (const prompt of FULL_INSPECTION_PROMPTS) {
        expect(reachableIds.has(prompt.id)).toBe(true);
      }
    });
  });

  describe('getPromptsForType', () => {
    it('returns all prompts for full inspection', () => {
      const prompts = getPromptsForType('full');
      expect(prompts).toEqual(FULL_INSPECTION_PROMPTS);
    });

    it('returns only quickMode prompts for quick inspection', () => {
      const prompts = getPromptsForType('quick');
      expect(prompts.length).toBeGreaterThan(0);
      expect(prompts.length).toBeLessThan(FULL_INSPECTION_PROMPTS.length);
      for (const p of prompts) {
        expect(p.quickMode).toBe(true);
      }
    });

    it('quick mode prompts are a subset of full prompts', () => {
      const fullIds = new Set(getPromptsForType('full').map((p) => p.id));
      const quickIds = getPromptsForType('quick').map((p) => p.id);
      for (const id of quickIds) {
        expect(fullIds.has(id)).toBe(true);
      }
    });

    it('entrance assessment and colony assessment are in quick mode', () => {
      const quickIds = getPromptsForType('quick').map((p) => p.id);
      expect(quickIds).toContain('entrance');
      expect(quickIds).toContain('colony_assessment');
    });
  });

  describe('expected root nodes', () => {
    it('starts with entrance assessment', () => {
      expect(FULL_INSPECTION_PROMPTS[0].id).toBe('entrance');
    });

    it('ends with action planning', () => {
      const last = FULL_INSPECTION_PROMPTS[FULL_INSPECTION_PROMPTS.length - 1];
      expect(last.id).toBe('action_planning');
    });

    it('includes brood inspection and queen cell check', () => {
      const ids = FULL_INSPECTION_PROMPTS.map((p) => p.id);
      expect(ids).toContain('brood_pattern');
      expect(ids).toContain('queen_cells');
    });

    it('includes stores and pest/disease checks', () => {
      const ids = FULL_INSPECTION_PROMPTS.map((p) => p.id);
      expect(ids).toContain('stores');
      expect(ids).toContain('pest_disease');
    });
  });
});
