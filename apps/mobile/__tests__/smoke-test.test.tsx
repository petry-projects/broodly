import React from 'react';
import { Text as RNText } from 'react-native';
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
    it('renders Heading with default size (lg)', () => {
      render(<Heading>Section Header</Heading>);
      expect(screen.getByText('Section Header')).toBeTruthy();
    });

    it('renders Heading with 5xl size', () => {
      render(<Heading size="5xl">Hero Title</Heading>);
      expect(screen.getByText('Hero Title')).toBeTruthy();
    });

    it('renders Heading with 4xl size', () => {
      render(<Heading size="4xl">Large Title</Heading>);
      expect(screen.getByText('Large Title')).toBeTruthy();
    });

    it('renders Heading with 3xl size', () => {
      render(<Heading size="3xl">Screen Title</Heading>);
      expect(screen.getByText('Screen Title')).toBeTruthy();
    });

    it('renders Heading with 2xl size', () => {
      render(<Heading size="2xl">Section Header 2xl</Heading>);
      expect(screen.getByText('Section Header 2xl')).toBeTruthy();
    });

    it('renders Heading with xl size', () => {
      render(<Heading size="xl">Card Title</Heading>);
      expect(screen.getByText('Card Title')).toBeTruthy();
    });

    it('renders Heading with md size', () => {
      render(<Heading size="md">Subsection</Heading>);
      expect(screen.getByText('Subsection')).toBeTruthy();
    });

    it('renders Heading with sm size', () => {
      render(<Heading size="sm">Small Heading</Heading>);
      expect(screen.getByText('Small Heading')).toBeTruthy();
    });

    it('renders Heading with xs size', () => {
      render(<Heading size="xs">Extra Small Heading</Heading>);
      expect(screen.getByText('Extra Small Heading')).toBeTruthy();
    });

    it('renders Heading with styling props (bold, italic)', () => {
      render(
        <Heading bold italic testID="styled-heading">
          Styled Heading
        </Heading>
      );
      expect(screen.getByTestId('styled-heading')).toBeTruthy();
      expect(screen.getByText('Styled Heading')).toBeTruthy();
    });

    it('renders Heading as a polymorphic component via the `as` prop', () => {
      render(
        <Heading as={RNText} testID="polymorphic-heading">
          Polymorphic Heading
        </Heading>
      );
      expect(screen.getByTestId('polymorphic-heading')).toBeTruthy();
      expect(screen.getByText('Polymorphic Heading')).toBeTruthy();
    });

    it('renders Heading as polymorphic with styling props', () => {
      render(
        <Heading as={RNText} bold testID="polymorphic-styled">
          Polymorphic with Styling
        </Heading>
      );
      expect(screen.getByTestId('polymorphic-styled')).toBeTruthy();
      expect(screen.getByText('Polymorphic with Styling')).toBeTruthy();
    });
  });
});
