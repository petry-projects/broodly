import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

/**
 * Mock @gluestack-ui/core to avoid react-dom@18 conflict.
 */
jest.mock('@gluestack-ui/core/button/creator', () => {
  const ReactMock = require('react');
  const { Text, View, ActivityIndicator } = require('react-native');

  function createButton({ Root }: { Root: React.ComponentType<unknown> }) {
    const Btn = Root as unknown as Record<string, unknown>;
    Btn.Text = ReactMock.forwardRef(function MockButtonText(
      props: Record<string, unknown>,
      ref: unknown
    ) {
      return ReactMock.createElement(Text, { ...props, ref });
    });
    Btn.Group = View;
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

import { GraphQLErrorBoundary } from './graphql-error-boundary';

function ThrowingComponent({ error }: { error: Error }): React.ReactNode {
  throw error;
}

function HealthyComponent() {
  return <>{/* uses RN Text directly to avoid gluestack */}</>;
}

describe('GraphQLErrorBoundary', () => {
  // Suppress console.error for expected errors in tests
  const originalError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });
  afterAll(() => {
    console.error = originalError;
  });

  it('renders children when no error occurs', () => {
    render(
      <GraphQLErrorBoundary>
        <HealthyComponent />
      </GraphQLErrorBoundary>
    );
    // No error UI should be present
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('renders default error UI when child throws', () => {
    render(
      <GraphQLErrorBoundary>
        <ThrowingComponent error={new Error('GraphQL query failed')} />
      </GraphQLErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(
      screen.getByText(/could not load the data/i)
    ).toBeTruthy();
  });

  it('renders retry button in error state', () => {
    render(
      <GraphQLErrorBoundary>
        <ThrowingComponent error={new Error('Network error')} />
      </GraphQLErrorBoundary>
    );

    expect(screen.getByText('Try Again')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    const { Text } = require('react-native');
    render(
      <GraphQLErrorBoundary fallback={<Text>Custom error view</Text>}>
        <ThrowingComponent error={new Error('Oops')} />
      </GraphQLErrorBoundary>
    );

    expect(screen.getByText('Custom error view')).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('clears error state on retry', () => {
    let shouldThrow = true;

    function ConditionalThrower() {
      if (shouldThrow) {
        throw new Error('Temporary error');
      }
      const { Text } = require('react-native');
      return <Text>Recovered content</Text>;
    }

    render(
      <GraphQLErrorBoundary>
        <ConditionalThrower />
      </GraphQLErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();

    // Fix the error condition and retry
    shouldThrow = false;
    fireEvent.press(screen.getByText('Try Again'));

    expect(screen.getByText('Recovered content')).toBeTruthy();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });
});
