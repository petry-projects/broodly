import React, { Component, type ReactNode } from 'react';
import { View } from 'react-native';
import { Text } from '../../../components/ui/text';
import { Heading } from '../../../components/ui/heading';
import { Button, ButtonText } from '../../../components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Error boundary for GraphQL query errors.
 * Renders a user-friendly error state with retry action.
 */
export class GraphQLErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  handleRetry = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          className="flex-1 bg-background-0 items-center justify-center p-6"
          accessibilityRole="alert"
        >
          <Heading size="xl" className="mb-2 text-error-600">
            Something went wrong
          </Heading>
          <Text size="md" className="text-typography-500 text-center mb-6">
            We could not load the data. Check your connection and try again.
          </Text>
          <Button
            action="primary"
            variant="solid"
            size="lg"
            onPress={this.handleRetry}
          >
            <ButtonText>Try Again</ButtonText>
          </Button>
        </View>
      );
    }

    return this.props.children;
  }
}
