import type { InspectionPrompt } from '../types';

export const FULL_INSPECTION_PROMPTS: InspectionPrompt[] = [
  {
    id: 'entrance',
    title: 'Entrance Assessment',
    description: 'Observe the hive entrance. What do you see? Look for normal flight patterns, dead bees, unusual activity, or signs of robbing.',
    compactLabel: 'Entrance activity',
    observationType: 'entrance_assessment',
    options: [
      { id: 'normal', label: 'Normal activity', classification: 'normal' },
      { id: 'reduced', label: 'Reduced activity', classification: 'cautionary' },
      { id: 'heavy_traffic', label: 'Heavy traffic / possible robbing', classification: 'urgent' },
      { id: 'dead_bees', label: 'Dead bees at entrance', classification: 'urgent' },
    ],
    isRequired: true,
    quickMode: true,
  },
  {
    id: 'brood_pattern',
    title: 'Brood Inspection',
    description: 'Pull a brood frame and examine the pattern. A good pattern is solid and compact. Spotty or empty patches may indicate problems.',
    compactLabel: 'Brood pattern',
    observationType: 'brood_inspection',
    options: [
      { id: 'solid', label: 'Solid brood pattern', classification: 'normal' },
      { id: 'spotty', label: 'Spotty / irregular pattern', classification: 'cautionary' },
      { id: 'empty', label: 'Little or no brood', classification: 'urgent' },
    ],
    isRequired: true,
    quickMode: true,
  },
  {
    id: 'queen_cells',
    title: 'Queen Cell Check',
    description: 'Look along the bottom of frames and comb edges for queen cells. Swarm cells hang from the bottom; supersedure cells are on the face.',
    compactLabel: 'Queen cells',
    observationType: 'queen_cell_check',
    options: [
      { id: 'none', label: 'No queen cells', classification: 'normal' },
      { id: 'supersedure', label: 'Supersedure cells (face of comb)', classification: 'cautionary' },
      { id: 'swarm', label: 'Swarm cells (bottom of frame)', classification: 'urgent', nextPromptOverride: 'swarm_risk' },
    ],
    isRequired: true,
    quickMode: true,
  },
  {
    id: 'swarm_risk',
    title: 'Swarm Risk Assessment',
    description: 'Swarm cells were found. How crowded is the hive? Are there eggs in the cells? This helps determine urgency.',
    compactLabel: 'Swarm risk details',
    observationType: 'swarm_risk',
    options: [
      { id: 'capped', label: 'Cells are capped — swarm imminent', classification: 'urgent' },
      { id: 'uncapped_eggs', label: 'Uncapped with eggs/larvae', classification: 'cautionary' },
      { id: 'empty_cups', label: 'Empty queen cups only', classification: 'normal' },
    ],
    isRequired: false,
    quickMode: false,
  },
  {
    id: 'stores',
    title: 'Stores Assessment',
    description: 'Check honey and pollen stores. Are frames heavy? Is there capped honey? Adequate pollen reserves?',
    compactLabel: 'Stores level',
    observationType: 'stores_assessment',
    options: [
      { id: 'abundant', label: 'Abundant stores', classification: 'normal' },
      { id: 'adequate', label: 'Adequate stores', classification: 'normal' },
      { id: 'low', label: 'Low stores — may need feeding', classification: 'cautionary' },
      { id: 'critical', label: 'Critically low — feed urgently', classification: 'urgent' },
    ],
    isRequired: true,
    quickMode: false,
  },
  {
    id: 'pest_disease',
    title: 'Pest & Disease Check',
    description: 'Look for signs of varroa mites, small hive beetles, wax moths, or disease symptoms like foulbrood.',
    compactLabel: 'Pests/disease',
    observationType: 'pest_disease',
    options: [
      { id: 'none', label: 'No signs of pests or disease', classification: 'normal' },
      { id: 'varroa', label: 'Varroa mites observed', classification: 'urgent' },
      { id: 'shb', label: 'Small hive beetles', classification: 'cautionary' },
      { id: 'other', label: 'Other pest/disease signs', classification: 'cautionary' },
    ],
    isRequired: true,
    quickMode: false,
  },
  {
    id: 'colony_assessment',
    title: 'Overall Colony Assessment',
    description: 'Based on everything you have observed, how would you rate the overall health of this colony?',
    compactLabel: 'Overall health',
    observationType: 'colony_assessment',
    options: [
      { id: 'strong', label: 'Strong and thriving', classification: 'normal' },
      { id: 'moderate', label: 'Moderate — some concerns', classification: 'cautionary' },
      { id: 'weak', label: 'Weak — needs intervention', classification: 'urgent' },
    ],
    isRequired: true,
    quickMode: true,
  },
  {
    id: 'action_planning',
    title: 'Action Planning',
    description: 'Based on your observations, what actions do you plan to take? You can also note any supplies needed for your next visit.',
    compactLabel: 'Next actions',
    observationType: 'action_planning',
    isRequired: true,
    quickMode: true,
  },
];

export function getPromptsForType(type: 'full' | 'quick'): InspectionPrompt[] {
  if (type === 'quick') {
    return FULL_INSPECTION_PROMPTS.filter((p) => p.quickMode);
  }
  return FULL_INSPECTION_PROMPTS;
}
