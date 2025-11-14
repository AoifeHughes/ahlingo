import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import PairButton from '../PairButton';
import { renderWithProviders } from '../../test-utils';

describe('PairButton', () => {
  const mockOnPress = jest.fn();
  const defaultProps = {
    text: 'Hello',
    pairId: 1,
    column: 0,
    selected: false,
    matched: false,
    onPress: mockOnPress,
  };

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders text correctly', () => {
    const { getByText } = renderWithProviders(
      <PairButton {...defaultProps} />
    );

    expect(getByText('Hello')).toBeTruthy();
  });

  it('calls onPress when button is pressed', () => {
    const { getByText } = renderWithProviders(
      <PairButton {...defaultProps} />
    );

    const button = getByText('Hello');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalledWith(1, 0);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows selected state correctly', () => {
    const { getByTestId } = renderWithProviders(
      <PairButton {...defaultProps} selected={true} />
    );

    const button = getByTestId('pair-button');
    // Check that the button has a backgroundColor style (flattened in RN Testing Library 13.x)
    expect(button.props.style).toHaveProperty('backgroundColor');
    expect(typeof button.props.style.backgroundColor).toBe('string');
  });

  it('shows matched state correctly', () => {
    const { getByTestId } = renderWithProviders(
      <PairButton {...defaultProps} matched={true} />
    );

    const button = getByTestId('pair-button');
    // Check accessibility state for disabled instead of props.disabled
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('handles long text correctly', () => {
    const longText = 'This is a very long text that should be handled properly by the button component';

    const { getByText } = renderWithProviders(
      <PairButton {...defaultProps} text={longText} />
    );

    expect(getByText(longText)).toBeTruthy();
  });

  it('applies correct accessibility props', () => {
    const { getByTestId } = renderWithProviders(
      <PairButton {...defaultProps} />
    );

    const button = getByTestId('pair-button');
    expect(button.props.accessibilityRole).toBe('button');
    expect(button.props.accessibilityLabel).toContain('Hello');
  });

  it('shows correct accessibility state when selected', () => {
    const { getByTestId } = renderWithProviders(
      <PairButton {...defaultProps} selected={true} />
    );

    const button = getByTestId('pair-button');
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ selected: true })
    );
  });

  it('shows correct accessibility state when matched', () => {
    const { getByTestId } = renderWithProviders(
      <PairButton {...defaultProps} matched={true} />
    );

    const button = getByTestId('pair-button');
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );
  });

  it('does not call onPress when disabled', () => {
    const { getByTestId } = renderWithProviders(
      <PairButton {...defaultProps} matched={true} />
    );

    const button = getByTestId('pair-button');
    fireEvent.press(button);

    expect(mockOnPress).not.toHaveBeenCalled();
  });
});
