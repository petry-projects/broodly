import type { ObservationClassification } from '../types';

export const CLASSIFICATION_STYLES: Record<
  ObservationClassification,
  { bg: string; text: string; icon: string; label: string }
> = {
  normal: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    icon: 'checkmark-circle',
    label: 'Normal',
  },
  cautionary: {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    icon: 'alert-circle',
    label: 'Cautionary',
  },
  urgent: {
    bg: 'bg-error-100',
    text: 'text-error-700',
    icon: 'warning',
    label: 'Urgent',
  },
};
