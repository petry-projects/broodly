/**
 * Tests for OnboardingProgressDots component logic.
 * Since packages/ui uses ts-jest in a node environment (no react-native runtime),
 * we test the component by calling it as a function and inspecting the returned element tree.
 */
import React from 'react';

jest.mock('react-native', () => ({
  View: 'View',
}));

import { OnboardingProgressDots } from './index';

function getElementTree(totalSteps: number, currentStep: number) {
  const element = OnboardingProgressDots({ totalSteps, currentStep });
  return element;
}

function getDotClassNames(totalSteps: number, currentStep: number): string[] {
  const element = getElementTree(totalSteps, currentStep);
  const children = element.props.children as React.ReactElement<{ className: string }>[];
  return children.map((child) => child.props.className);
}

describe('OnboardingProgressDots', () => {
  it('renders correct number of dots', () => {
    const element = getElementTree(5, 1);
    const children = element.props.children as React.ReactElement[];
    expect(children).toHaveLength(5);
  });

  it('highlights current step with primary color', () => {
    const classNames = getDotClassNames(4, 2);
    // Step 2 is index 1
    expect(classNames[1]).toContain('bg-primary-500');
  });

  it('applies success style to completed steps', () => {
    const classNames = getDotClassNames(4, 3);
    // Steps 1 and 2 (indices 0, 1) are completed
    expect(classNames[0]).toContain('bg-success-500');
    expect(classNames[1]).toContain('bg-success-500');
  });

  it('applies outline style to pending steps', () => {
    const classNames = getDotClassNames(4, 2);
    // Steps 3 and 4 (indices 2, 3) are pending
    expect(classNames[2]).toContain('bg-outline-200');
    expect(classNames[3]).toContain('bg-outline-200');
  });

  it('sets accessibility label with step info', () => {
    const element = getElementTree(5, 3);
    expect(element.props.accessibilityLabel).toBe('Step 3 of 5');
  });

  it('sets accessibility value min, max, now', () => {
    const element = getElementTree(6, 4);
    expect(element.props.accessibilityValue).toEqual({
      min: 1,
      max: 6,
      now: 4,
    });
  });

  it('first step is active when currentStep is 1', () => {
    const classNames = getDotClassNames(3, 1);
    expect(classNames[0]).toContain('bg-primary-500');
    expect(classNames[1]).toContain('bg-outline-200');
    expect(classNames[2]).toContain('bg-outline-200');
  });

  it('last step active means all prior steps are complete', () => {
    const classNames = getDotClassNames(3, 3);
    expect(classNames[0]).toContain('bg-success-500');
    expect(classNames[1]).toContain('bg-success-500');
    expect(classNames[2]).toContain('bg-primary-500');
  });
});
