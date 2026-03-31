import type { InspectionPrompt, InspectionType, Observation } from '../types';
import { getPromptsForType } from '../constants/prompt-tree';

export function getPromptSequence(
  type: InspectionType,
  observations: Observation[],
): InspectionPrompt[] {
  const basePrompts = getPromptsForType(type);
  const result: InspectionPrompt[] = [];

  for (const prompt of basePrompts) {
    result.push(prompt);

    // Check if any observation for this prompt triggers a branch
    const obs = observations.find((o) => o.promptId === prompt.id);
    if (obs && prompt.options) {
      const selected = prompt.options.find((o) => o.id === obs.value);
      if (selected?.nextPromptOverride) {
        const branchPrompt = basePrompts.find((p) => p.id === selected.nextPromptOverride);
        if (branchPrompt && !result.includes(branchPrompt)) {
          // Insert branch prompt after current
          result.push(branchPrompt);
        }
      }
    }
  }

  // Remove duplicates while preserving order
  const seen = new Set<string>();
  return result.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export function getNextPromptIndex(
  currentIndex: number,
  prompts: InspectionPrompt[],
): number | null {
  const nextIndex = currentIndex + 1;
  return nextIndex < prompts.length ? nextIndex : null;
}

export function getTotalSteps(type: InspectionType, observations: Observation[]): number {
  return getPromptSequence(type, observations).length;
}
