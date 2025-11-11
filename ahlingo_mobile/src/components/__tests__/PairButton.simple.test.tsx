import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderSimple, createMockFunction } from '../../test-utils/simple-render';

// Mock the theme hook before importing component
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        background: '#FFFFFF',
        text: '#000000',
        success: '#34C759',
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 },
      borderRadius: { base: 8 },
      typography: {
        fontSizes: { lg: 20 },
        fontWeights: { medium: '500' },
      },
      shadows: { base: {} },
    },
  }),
}));

import PairButton from '../PairButton';

describe('PairButton (Simple)', () => {
  const mockOnPress = createMockFunction();
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
    const { getByText } = renderSimple(<PairButton {...defaultProps} />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('calls onPress when button is pressed', () => {
    const { getByText } = renderSimple(<PairButton {...defaultProps} />);
    const button = getByText('Hello');
    fireEvent.press(button);
    expect(mockOnPress).toHaveBeenCalledWith(1, 0);
  });

  it('shows selected state correctly', () => {
    const { getByTestId } = renderSimple(
      <PairButton {...defaultProps} selected={true} />
    );
    const button = getByTestId('pair-button');
    expect(button.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#5856D6', // secondary color for selected state
      })
    );
  });

  it('is disabled when matched', () => {
    const { getByTestId } = renderSimple(
      <PairButton {...defaultProps} matched={true} />
    );
    const button = getByTestId('pair-button');
    // Check if TouchableOpacity is disabled and has success background color
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true })
    );
    expect(button.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#34C759', // success color for matched state
      })
    );
  });
});
