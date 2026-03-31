import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TranscriptEditor } from './TranscriptEditor';

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock theme colors
jest.mock('../../../theme/colors', () => ({
  ICON_COLORS: {
    muted: 'gray',
    primary: 'amber',
    success: 'green',
    warning: 'orange',
    error: 'red',
    info: 'blue',
    white: 'white',
  },
}));

const defaultProps = {
  observationId: 'obs-1',
  observationLabel: 'entrance assessment',
  originalTranscription: 'bees look healthy',
  currentValue: 'bees look healthy',
  confidence: 0.95,
  isEdited: false,
  onSave: jest.fn(),
};

describe('TranscriptEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders observation label', () => {
    const { getByText } = render(<TranscriptEditor {...defaultProps} />);
    expect(getByText('entrance assessment')).toBeTruthy();
  });

  it('renders current value', () => {
    const { getByText } = render(<TranscriptEditor {...defaultProps} />);
    expect(getByText('bees look healthy')).toBeTruthy();
  });

  it('renders confidence indicator', () => {
    const { getByText } = render(<TranscriptEditor {...defaultProps} />);
    expect(getByText('High confidence (95%)')).toBeTruthy();
  });

  it('renders low confidence indicator', () => {
    const { getByText } = render(
      <TranscriptEditor {...defaultProps} confidence={0.4} />,
    );
    expect(getByText('Low confidence (40%)')).toBeTruthy();
  });

  it('renders medium confidence indicator', () => {
    const { getByText } = render(
      <TranscriptEditor {...defaultProps} confidence={0.75} />,
    );
    expect(getByText('Medium confidence (75%)')).toBeTruthy();
  });

  it('renders edited badge when isEdited is true', () => {
    const { getByText } = render(
      <TranscriptEditor {...defaultProps} isEdited={true} />,
    );
    expect(getByText('Edited')).toBeTruthy();
  });

  it('does not render edited badge when isEdited is false', () => {
    const { queryByText } = render(<TranscriptEditor {...defaultProps} />);
    expect(queryByText('Edited')).toBeNull();
  });

  it('shows edit button with pencil icon', () => {
    const { getByTestId } = render(<TranscriptEditor {...defaultProps} />);
    expect(getByTestId('transcript-edit-btn-obs-1')).toBeTruthy();
  });

  it('enters edit mode when edit button is pressed', () => {
    const { getByTestId } = render(<TranscriptEditor {...defaultProps} />);

    fireEvent.press(getByTestId('transcript-edit-btn-obs-1'));
    expect(getByTestId('transcript-input-obs-1')).toBeTruthy();
  });

  it('shows save and cancel buttons in edit mode', () => {
    const { getByTestId } = render(<TranscriptEditor {...defaultProps} />);

    fireEvent.press(getByTestId('transcript-edit-btn-obs-1'));
    expect(getByTestId('transcript-save-obs-1')).toBeTruthy();
    expect(getByTestId('transcript-cancel-obs-1')).toBeTruthy();
  });

  it('calls onSave with updated value', () => {
    const onSave = jest.fn();
    const { getByTestId } = render(
      <TranscriptEditor {...defaultProps} onSave={onSave} />,
    );

    fireEvent.press(getByTestId('transcript-edit-btn-obs-1'));
    fireEvent.changeText(
      getByTestId('transcript-input-obs-1'),
      'bees look very healthy',
    );
    fireEvent.press(getByTestId('transcript-save-obs-1'));

    expect(onSave).toHaveBeenCalledWith('obs-1', 'bees look very healthy');
  });

  it('cancels editing without saving', () => {
    const onSave = jest.fn();
    const { getByTestId, queryByTestId } = render(
      <TranscriptEditor {...defaultProps} onSave={onSave} />,
    );

    fireEvent.press(getByTestId('transcript-edit-btn-obs-1'));
    fireEvent.changeText(getByTestId('transcript-input-obs-1'), 'changed');
    fireEvent.press(getByTestId('transcript-cancel-obs-1'));

    expect(onSave).not.toHaveBeenCalled();
    expect(queryByTestId('transcript-input-obs-1')).toBeNull();
  });

  it('has accessible label on the container', () => {
    const { getByTestId } = render(<TranscriptEditor {...defaultProps} />);
    const container = getByTestId('transcript-editor-obs-1');
    expect(container.props.accessibilityLabel).toContain(
      'entrance assessment transcription',
    );
  });

  it('indicates low confidence in accessibility label', () => {
    const { getByTestId } = render(
      <TranscriptEditor {...defaultProps} confidence={0.4} />,
    );
    const container = getByTestId('transcript-editor-obs-1');
    expect(container.props.accessibilityLabel).toContain('low confidence');
  });

  it('renders without confidence when not provided', () => {
    const { queryByText } = render(
      <TranscriptEditor {...defaultProps} confidence={undefined} />,
    );
    expect(queryByText(/confidence/i)).toBeNull();
  });
});
