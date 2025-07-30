import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderSimple, createMockFunction } from '../../test-utils/simple-render';

// Mock the theme hook
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        background: '#FFFFFF',
        surface: '#F5F5F5',
        text: '#000000',
        textSecondary: '#666666',
        primary: '#007AFF',
        success: '#34C759',
        error: '#FF3B30',
        warning: '#FF9500',
      },
      spacing: {
        xs: 4,
        sm: 8,
        base: 12,
        md: 16,
        lg: 24,
        xl: 32,
        '2xl': 48,
        '3xl': 64,
      },
      borderRadius: { 
        base: 8,
        lg: 12 
      },
      typography: {
        fontSizes: {
          sm: 12,
          base: 16,
          lg: 20,
          xl: 24,
          '2xl': 28,
          '3xl': 32,
        },
        fontWeights: {
          medium: '500',
          semibold: '600',
          bold: '700',
        },
      },
      shadows: { base: {} },
    },
  }),
}));

// Navigation and BackHandler are mocked globally in setup.ts

import ExerciseShuffleSummaryScreen from '../ExerciseShuffleSummaryScreen';

describe('ExerciseShuffleSummaryScreen', () => {
  const mockNavigation = {
    navigate: createMockFunction(),
    goBack: createMockFunction(),
  };

  const createMockRoute = (results: boolean[], exercises: any[] = []) => ({
    params: {
      results,
      exercises,
    },
    name: 'ExerciseShuffleSummary',
    key: 'summary',
  });

  beforeEach(() => {
    mockNavigation.navigate.mockClear();
    mockNavigation.goBack.mockClear();
  });

  it('renders with perfect score', () => {
    const route = createMockRoute([true, true, true, true, true]);
    const { getByText, getAllByText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={route as any} 
      />
    );
    
    // Check that we have multiple '5's (completed and total both show 5)
    const fives = getAllByText('5');
    expect(fives.length).toBe(2); // Both completed and total should be 5
    expect(getByText('Completed')).toBeTruthy();
    expect(getByText('Total')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
    expect(getByText('Excellent work! 🌟')).toBeTruthy();
  });

  it('renders with partial score', () => {
    const route = createMockRoute([true, false, true, false, true]);
    const { getByText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={route as any} 
      />
    );
    
    expect(getByText('3')).toBeTruthy(); // Completed count
    expect(getByText('60%')).toBeTruthy();
    expect(getByText('Great progress! 👏')).toBeTruthy();
  });

  it('renders with low score', () => {
    const route = createMockRoute([true, false, false, false, false]);
    const { getByText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={route as any} 
      />
    );
    
    expect(getByText('1')).toBeTruthy(); // Completed count
    expect(getByText('20%')).toBeTruthy();
    expect(getByText('Keep practicing! 📚')).toBeTruthy();
  });

  it('renders with zero score', () => {
    const route = createMockRoute([false, false, false, false, false]);
    const { getByText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={route as any} 
      />
    );
    
    expect(getByText('0')).toBeTruthy(); // Completed count
    expect(getByText('0%')).toBeTruthy();
    expect(getByText('Keep practicing! 📚')).toBeTruthy();
  });

  it('handles empty results array', () => {
    const route = createMockRoute([]);
    const { getByText, getAllByText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={route as any} 
      />
    );
    
    // Both completed and total should be 0
    const zeros = getAllByText('0');
    expect(zeros.length).toBe(2);
    expect(getByText('0%')).toBeTruthy();
  });

  it('shows different encouragement messages based on score', () => {
    // Test 85% score
    const highRoute = createMockRoute([true, true, true, true, false]);
    const { getByText: getHighText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={highRoute as any} 
      />
    );
    expect(getHighText('Excellent work! 🌟')).toBeTruthy();

    // Test 65% score  
    const mediumRoute = createMockRoute([true, true, true, false, false]);
    const { getByText: getMediumText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={mediumRoute as any} 
      />
    );
    expect(getMediumText('Great progress! 👏')).toBeTruthy();

    // Test 45% score
    const lowMediumRoute = createMockRoute([true, true, false, false, false]);
    const { getByText: getLowMediumText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={lowMediumRoute as any} 
      />
    );
    expect(getLowMediumText('Good effort! 💪')).toBeTruthy();
  });

  it('handles single exercise result', () => {
    const route = createMockRoute([true]);
    const { getByText, getAllByText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={route as any} 
      />
    );
    
    // Both completed and total should be 1
    const ones = getAllByText('1');
    expect(ones.length).toBe(2);
    expect(getByText('100%')).toBeTruthy();
  });

  it('renders back to main menu button', () => {
    const route = createMockRoute([true, false, true]);
    const { getByText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={route as any} 
      />
    );
    
    expect(getByText('Back to Main Menu')).toBeTruthy();
  });

  it('navigates to main menu when back button is pressed', () => {
    const route = createMockRoute([true, false, true]);
    const { getByText } = renderSimple(
      <ExerciseShuffleSummaryScreen 
        navigation={mockNavigation as any} 
        route={route as any} 
      />
    );
    
    const backButton = getByText('Back to Main Menu');
    fireEvent.press(backButton);
    expect(mockNavigation.navigate).toHaveBeenCalledWith('MainMenu');
  });
});