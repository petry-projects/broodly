/**
 * @jest-environment jsdom
 */
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
}));

jest.mock('../src/store/auth-store', () => ({
  useAuthStore: (selector: (s: { user: { displayName: string } | null }) => unknown) =>
    selector({ user: { displayName: 'DJ' } }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../components/ui/heading', () => {
  const { Text } = require('react-native');
  return { Heading: (props: Record<string, unknown>) => require('react').createElement(Text, props, props.children) };
});

jest.mock('../components/ui/text', () => {
  const { Text } = require('react-native');
  return { Text: (props: Record<string, unknown>) => require('react').createElement(Text, props, props.children) };
});

jest.mock('../components/ui/button', () => {
  const { View, Text } = require('react-native');
  return {
    Button: (props: Record<string, unknown>) => require('react').createElement(View, { ...props, accessible: true }, props.children),
    ButtonText: (props: Record<string, unknown>) => require('react').createElement(Text, {}, props.children),
  };
});

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';

describe('Homepage', () => {
  it('renders greeting with user name', () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    render(<HomeScreen />);
    expect(screen.getByText('Hello, DJ')).toBeTruthy();
  });

  it('renders context message', () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    render(<HomeScreen />);
    expect(screen.getByText(/what matters today/)).toBeTruthy();
  });

  it('renders two primary CTAs', () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    render(<HomeScreen />);
    expect(screen.getByTestId('start-plan-btn')).toBeTruthy();
    expect(screen.getByTestId('view-apiaries-btn')).toBeTruthy();
  });

  it('navigates to plan on Start Today\'s Plan tap', () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId('start-plan-btn'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/plan');
  });

  it('navigates to apiaries on View My Apiaries tap', () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    render(<HomeScreen />);
    fireEvent.press(screen.getByTestId('view-apiaries-btn'));
    expect(mockPush).toHaveBeenCalledWith('/(tabs)/apiaries');
  });

  it('renders context cards for weather, bloom, and season', () => {
    const HomeScreen = require('../app/(tabs)/index').default;
    render(<HomeScreen />);
    expect(screen.getByText('Weather')).toBeTruthy();
    expect(screen.getByText('Bloom Status')).toBeTruthy();
    expect(screen.getByText('Seasonal Phase')).toBeTruthy();
  });
});
