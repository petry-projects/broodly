import React from 'react';
import { render, screen } from '@testing-library/react-native';

/**
 * Mock @gluestack-ui/core to avoid react-dom@18 / React 19
 * version mismatch in the test environment. The real component is tested
 * visually during Expo development.
 */
jest.mock('@gluestack-ui/core/button/creator', () => {
  const ReactMock = require('react');
  const { Text, View, ActivityIndicator } =
    require('react-native');

  function createButton({ Root }: { Root: React.ComponentType<unknown> }) {
    const Btn = Root as unknown as Record<string, unknown>;

    Btn.Text = ReactMock.forwardRef(function MockButtonText(
      props: Record<string, unknown>,
      ref: unknown
    ) {
      return ReactMock.createElement(Text, { ...props, ref });
    });

    Btn.Group = ReactMock.forwardRef(function MockButtonGroup(
      props: Record<string, unknown>,
      ref: unknown
    ) {
      return ReactMock.createElement(View, { ...props, ref });
    });

    Btn.Spinner = ActivityIndicator;
    Btn.Icon = View;

    return Btn;
  }

  return { createButton };
});

jest.mock('@gluestack-ui/core/icon/creator', () => {
  const { View } = require('react-native');
  return { PrimitiveIcon: View, UIIcon: View };
});

import { Button, ButtonText } from '../components/ui/button';

describe('Button Smoke Tests', () => {
  it('renders Button with ButtonText using compound pattern', () => {
    render(
      <Button action="primary" variant="solid" testID="smoke-button">
        <ButtonText>Start Inspection</ButtonText>
      </Button>
    );

    expect(screen.getByText('Start Inspection')).toBeTruthy();
  });

  it('renders Button with different action variants', () => {
    render(
      <>
        <Button action="positive" variant="solid">
          <ButtonText>Did It</ButtonText>
        </Button>
        <Button action="negative" variant="solid">
          <ButtonText>Report Issue</ButtonText>
        </Button>
      </>
    );

    expect(screen.getByText('Did It')).toBeTruthy();
    expect(screen.getByText('Report Issue')).toBeTruthy();
  });

  it('renders Button with outline variant', () => {
    render(
      <Button action="primary" variant="outline">
        <ButtonText>View My Apiaries</ButtonText>
      </Button>
    );

    expect(screen.getByText('View My Apiaries')).toBeTruthy();
  });

  it('renders Button with xl size for field use', () => {
    render(
      <Button action="primary" variant="solid" size="xl">
        <ButtonText>Start Plan</ButtonText>
      </Button>
    );

    expect(screen.getByText('Start Plan')).toBeTruthy();
  });
});
