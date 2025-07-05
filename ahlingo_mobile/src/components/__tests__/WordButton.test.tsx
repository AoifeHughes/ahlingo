import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderSimple, createMockFunction } from '../../test-utils/simple-render';

// Mock the theme hook before importing component
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        surface: '#F5F5F5',
        border: '#E0E0E0',
        primary: '#007AFF',
        primaryLight: '#4DA3FF',
        text: '#000000',
        textLight: '#888888',
        buttonDisabled: '#CCCCCC',
      },
      spacing: { xs: 4, sm: 8, base: 12, md: 16, lg: 24 },
      borderRadius: { base: 8 },
      typography: {
        fontSizes: { lg: 20 },
        fontWeights: { medium: '500', semibold: '600' },
      },
      shadows: { sm: {} },
    },
  }),
}));

import WordButton from '../WordButton';

describe('WordButton', () => {
  const mockOnPress = createMockFunction();
  const defaultProps = {
    word: 'hello',
    index: 0,
    isSelected: false,
    onPress: mockOnPress,
  };

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders word text correctly', () => {
    const { getByText } = renderSimple(<WordButton {...defaultProps} />);
    expect(getByText('hello')).toBeTruthy();
  });

  it('calls onPress with correct parameters when pressed', () => {
    const { getByText } = renderSimple(<WordButton {...defaultProps} />);
    const button = getByText('hello');
    fireEvent.press(button);
    expect(mockOnPress).toHaveBeenCalledWith('hello', 0);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('shows selected state with correct styling', () => {
    const { getByTestId } = renderSimple(
      <WordButton {...defaultProps} isSelected={true} />
    );
    const touchable = getByTestId('word-button');
    expect(touchable.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#4DA3FF30', // primaryLight + '30'
        borderColor: '#007AFF', // primary
      })
    );
  });

  it('shows disabled state with correct styling', () => {
    const { getByTestId } = renderSimple(
      <WordButton {...defaultProps} disabled={true} />
    );
    const touchable = getByTestId('word-button');
    expect(touchable.props.style).toEqual(
      expect.objectContaining({
        backgroundColor: '#CCCCCC', // buttonDisabled
        opacity: 0.5,
      })
    );
  });

  it('does not call onPress when disabled', () => {
    const { getByText } = renderSimple(
      <WordButton {...defaultProps} disabled={true} />
    );
    const button = getByText('hello');
    fireEvent.press(button);
    expect(mockOnPress).not.toHaveBeenCalled();
  });

  it('handles different word values', () => {
    const { getByText } = renderSimple(
      <WordButton {...defaultProps} word="bonjour" index={5} />
    );
    expect(getByText('bonjour')).toBeTruthy();
    
    const button = getByText('bonjour');
    fireEvent.press(button);
    expect(mockOnPress).toHaveBeenCalledWith('bonjour', 5);
  });

  it('shows combined selected and disabled state', () => {
    const { getByTestId } = renderSimple(
      <WordButton {...defaultProps} isSelected={true} disabled={true} />
    );
    const touchable = getByTestId('word-button');
    // Should show both selected and disabled styles
    expect(touchable.props.style).toEqual(
      expect.objectContaining({
        opacity: 0.5, // disabled opacity
        backgroundColor: '#CCCCCC', // disabled takes precedence
      })
    );
  });
});