import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Text } from '../components/ui/text';
import { Heading } from '../components/ui/heading';

/**
 * Smoke tests for Gluestack UI v3 components with Broodly design tokens.
 *
 * Button tests require @gluestack-ui/core which transitively loads
 * @react-aria (react-dom@18). Until react-dom is aligned to React 19,
 * Button is tested separately in the Button-specific test file.
 */
describe('Gluestack UI Smoke Tests', () => {
  describe('Text', () => {
    it('renders Text with default size', () => {
      render(<Text>Body copy text</Text>);
      expect(screen.getByText('Body copy text')).toBeTruthy();
    });

    it('renders Text with explicit size', () => {
      render(<Text size="sm">Small text</Text>);
      expect(screen.getByText('Small text')).toBeTruthy();
    });

    it('renders Text with bold variant', () => {
      render(<Text bold>Bold text</Text>);
      expect(screen.getByText('Bold text')).toBeTruthy();
    });
  });

  describe('Heading', () => {
    it('renders Heading with default size', () => {
      render(<Heading>Section Header</Heading>);
      expect(screen.getByText('Section Header')).toBeTruthy();
    });

    it('renders Heading with 3xl size', () => {
      render(<Heading size="3xl">Screen Title</Heading>);
      expect(screen.getByText('Screen Title')).toBeTruthy();
    });

    it('renders Heading with xl size', () => {
      render(<Heading size="xl">Card Title</Heading>);
      expect(screen.getByText('Card Title')).toBeTruthy();
    });

    it('renders Heading with 2xl size', () => {
      render(<Heading size="2xl">Section Header 2xl</Heading>);
      expect(screen.getByText('Section Header 2xl')).toBeTruthy();
    });
  });
});
