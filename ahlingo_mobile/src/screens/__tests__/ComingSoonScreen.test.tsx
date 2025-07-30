import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderSimple, createMockFunction } from '../../test-utils/simple-render';

// Mock the theme hook
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#FFFFFF',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#007AFF',
      },
      spacing: {
        base: 12,
        lg: 24,
        xl: 32,
        '2xl': 48,
        '4xl': 96,
      },
      borderRadius: { lg: 12 },
      typography: {
        fontSizes: {
          base: 16,
          lg: 20,
          '2xl': 28,
          '3xl': 32,
        },
        fontWeights: {
          bold: '700',
          semibold: '600',
        },
      },
      shadows: { base: {} },
    },
  }),
}));

import ComingSoonScreen from '../ComingSoonScreen';

describe('ComingSoonScreen', () => {
  const mockNavigation = {
    navigate: createMockFunction(),
    goBack: createMockFunction(),
  };

  const mockRoute = {
    params: {},
    name: 'ComingSoon',
    key: 'coming-soon',
  };

  const defaultProps = {
    navigation: mockNavigation as any,
    route: mockRoute as any,
    featureName: 'New Feature',
    featureIcon: '🚀',
  };

  beforeEach(() => {
    mockNavigation.navigate.mockClear();
    mockNavigation.goBack.mockClear();
  });

  it('renders feature name correctly', () => {
    const { getByText } = renderSimple(<ComingSoonScreen {...defaultProps} />);
    expect(getByText('New Feature')).toBeTruthy();
  });

  it('renders feature icon correctly', () => {
    const { getByText } = renderSimple(<ComingSoonScreen {...defaultProps} />);
    expect(getByText('🚀')).toBeTruthy();
  });

  it('renders "Coming Soon!" text', () => {
    const { getByText } = renderSimple(<ComingSoonScreen {...defaultProps} />);
    expect(getByText('Coming Soon!')).toBeTruthy();
  });

  it('renders default message', () => {
    const { getByText } = renderSimple(<ComingSoonScreen {...defaultProps} />);
    expect(getByText(/We're working hard to bring you this exciting new feature/)).toBeTruthy();
  });

  it('renders optional description when provided', () => {
    const propsWithDescription = {
      ...defaultProps,
      description: 'This feature will help you learn faster',
    };
    const { getByText } = renderSimple(<ComingSoonScreen {...propsWithDescription} />);
    expect(getByText('This feature will help you learn faster')).toBeTruthy();
  });

  it('does not render description when not provided', () => {
    const { queryByText } = renderSimple(<ComingSoonScreen {...defaultProps} />);
    expect(queryByText('This feature will help you learn faster')).toBeNull();
  });

  it('renders back button', () => {
    const { getByText } = renderSimple(<ComingSoonScreen {...defaultProps} />);
    expect(getByText('Back to Main Menu')).toBeTruthy();
  });

  it('navigates to MainMenu when back button is pressed', () => {
    const { getByText } = renderSimple(<ComingSoonScreen {...defaultProps} />);
    const backButton = getByText('Back to Main Menu');
    fireEvent.press(backButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MainMenu');
    expect(mockNavigation.navigate).toHaveBeenCalledTimes(1);
  });

  it('handles different feature names', () => {
    const customProps = {
      ...defaultProps,
      featureName: 'Advanced Grammar',
      featureIcon: '📚',
    };
    const { getByText } = renderSimple(<ComingSoonScreen {...customProps} />);
    expect(getByText('Advanced Grammar')).toBeTruthy();
    expect(getByText('📚')).toBeTruthy();
  });

  it('handles long feature names', () => {
    const longNameProps = {
      ...defaultProps,
      featureName: 'Very Long Feature Name That Should Be Displayed Properly',
    };
    const { getByText } = renderSimple(<ComingSoonScreen {...longNameProps} />);
    expect(getByText('Very Long Feature Name That Should Be Displayed Properly')).toBeTruthy();
  });

  it('handles long descriptions', () => {
    const longDescriptionProps = {
      ...defaultProps,
      description: 'This is a very long description that explains all the amazing features and benefits that this new functionality will bring to users when it becomes available in future updates.',
    };
    const { getByText } = renderSimple(<ComingSoonScreen {...longDescriptionProps} />);
    expect(getByText(/This is a very long description that explains all the amazing features/)).toBeTruthy();
  });

  it('back button is pressable', () => {
    const { getByText } = renderSimple(<ComingSoonScreen {...defaultProps} />);
    const backButton = getByText('Back to Main Menu');
    // Just test that the button exists and is pressable
    expect(backButton).toBeTruthy();
    fireEvent.press(backButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MainMenu');
  });
});