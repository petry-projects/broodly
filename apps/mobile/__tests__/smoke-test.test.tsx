import React from 'react';
import { Text as RNText } from 'react-native';
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
