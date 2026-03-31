import React from 'react';
import { View } from 'react-native';

interface OnboardingProgressDotsProps {
  totalSteps: number;
  currentStep: number;
}

/**
 * Onboarding progress indicator dots.
 * - Done steps: success-500
 * - Active step: primary-500
 * - Pending steps: outline-200
 * 8px diameter dots with 6px gap.
 */
export function OnboardingProgressDots({
  totalSteps,
  currentStep,
}: OnboardingProgressDotsProps) {
  return (
    <View
      className="flex-row items-center justify-center gap-1.5 py-4"
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
      accessibilityValue={{ min: 1, max: totalSteps, now: currentStep }}
      testID="progress-dots"
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        let colorClass = 'bg-outline-200'; // pending
        if (step < currentStep) colorClass = 'bg-success-500'; // done
        if (step === currentStep) colorClass = 'bg-primary-500'; // active

        return (
          <View
            key={step}
            className={`w-2 h-2 rounded-full ${colorClass}`}
          />
        );
      })}
    </View>
  );
}
