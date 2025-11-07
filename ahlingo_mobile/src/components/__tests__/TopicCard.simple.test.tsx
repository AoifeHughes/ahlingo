import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderSimple, createMockFunction } from '../../test-utils/simple-render';

// Mock the theme hook before importing component
jest.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    theme: {
      colors: {
        primary: '#007AFF',
        background: '#FFFFFF',
        text: '#000000',
        textLight: '#888888',
        surface: '#F5F5F5',
        border: '#E0E0E0',
      },
      spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
      borderRadius: { base: 8, large: 12 },
      typography: {
        fontSizes: { md: 16, lg: 20, xl: 24 },
        fontWeights: { medium: '500', bold: '700' },
      },
      shadows: { base: {} },
    },
  }),
}));

// Mock ProgressRing component
jest.mock('../../components/ProgressRing', () => {
  return function MockProgressRing(props: any) {
    return null; // Return null for simplified testing
  };
});

import TopicCard from '../TopicCard';

describe('TopicCard (Simple)', () => {
  const mockOnPress = createMockFunction();
  const defaultTopic = {
    id: 1,
    topic: 'Basic Greetings',
    progress: {
      totalExercises: 10,
      completedExercises: 5,
      percentage: 50,
    },
  };

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders topic name correctly', () => {
    const { getByText } = renderSimple(
      <TopicCard topic={defaultTopic} onPress={mockOnPress} />
    );
    expect(getByText('Basic Greetings')).toBeTruthy();
  });

  it('renders progress text correctly', () => {
    const { getByText } = renderSimple(
      <TopicCard topic={defaultTopic} onPress={mockOnPress} />
    );
    expect(getByText('5/10 exercises')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = renderSimple(
      <TopicCard topic={defaultTopic} onPress={mockOnPress} />
    );
    const card = getByTestId('topic-card-1'); // Use the new ID-based testID
    fireEvent.press(card);
    expect(mockOnPress).toHaveBeenCalledWith(defaultTopic);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('handles zero progress correctly', () => {
    const zeroTopic = {
      ...defaultTopic,
      progress: {
        totalExercises: 10,
        completedExercises: 0,
        percentage: 0,
      },
    };
    const { getByText } = renderSimple(
      <TopicCard topic={zeroTopic} onPress={mockOnPress} />
    );
    expect(getByText('0/10 exercises')).toBeTruthy();
  });

  it('handles completed progress correctly', () => {
    const completedTopic = {
      ...defaultTopic,
      progress: {
        totalExercises: 10,
        completedExercises: 10,
        percentage: 100,
      },
    };
    const { getByText } = renderSimple(
      <TopicCard topic={completedTopic} onPress={mockOnPress} />
    );
    expect(getByText('10/10 exercises')).toBeTruthy();
  });

  it('handles long topic names', () => {
    const longNameTopic = {
      ...defaultTopic,
      topic: 'Very Long Topic Name That Should Be Handled Properly',
    };
    const { getByText } = renderSimple(
      <TopicCard topic={longNameTopic} onPress={mockOnPress} />
    );
    expect(getByText('Very Long Topic Name That Should Be Handled Properly')).toBeTruthy();
  });

  it('handles large numbers correctly', () => {
    const largeTopic = {
      ...defaultTopic,
      progress: {
        totalExercises: 200,
        completedExercises: 150,
        percentage: 75,
      },
    };
    const { getByText } = renderSimple(
      <TopicCard topic={largeTopic} onPress={mockOnPress} />
    );
    expect(getByText('150/200 exercises')).toBeTruthy();
  });
});
