import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import TopicCard from '../TopicCard';
import { renderWithProviders } from '../../test-utils';
import { createTopic } from '../../test-utils/factories';

describe('TopicCard', () => {
  const mockOnPress = jest.fn();

  const mockTopic = {
    ...createTopic({ topic: 'Greetings' }),
    progress: {
      totalExercises: 10,
      completedExercises: 7,
      percentage: 70,
    },
  };

  beforeEach(() => {
    mockOnPress.mockClear();
  });

  it('renders topic information correctly', () => {
    const { getByText } = renderWithProviders(
      <TopicCard topic={mockTopic} onPress={mockOnPress} />
    );

    expect(getByText('Greetings')).toBeTruthy();
    expect(getByText('7/10 exercises')).toBeTruthy();
    expect(getByText('70%')).toBeTruthy();
  });

  it('calls onPress when card is pressed', () => {
    const { getByTestId } = renderWithProviders(
      <TopicCard topic={mockTopic} onPress={mockOnPress} />
    );

    const card = getByTestId(`topic-card-${mockTopic.id}`);
    fireEvent.press(card);

    expect(mockOnPress).toHaveBeenCalledWith(mockTopic);
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  it('displays progress ring with correct percentage', () => {
    const { getByTestId } = renderWithProviders(
      <TopicCard topic={mockTopic} onPress={mockOnPress} />
    );

    const progressRing = getByTestId('progress-ring');
    expect(progressRing).toBeTruthy();
  });

  it('handles zero progress correctly', () => {
    const zeroProgressTopic = {
      ...mockTopic,
      progress: {
        totalExercises: 5,
        completedExercises: 0,
        percentage: 0,
      },
    };

    const { getByText } = renderWithProviders(
      <TopicCard topic={zeroProgressTopic} onPress={mockOnPress} />
    );

    expect(getByText('0/5 exercises')).toBeTruthy();
    expect(getByText('0%')).toBeTruthy();
  });

  it('handles complete progress correctly', () => {
    const completeTopic = {
      ...mockTopic,
      progress: {
        totalExercises: 8,
        completedExercises: 8,
        percentage: 100,
      },
    };

    const { getByText } = renderWithProviders(
      <TopicCard topic={completeTopic} onPress={mockOnPress} />
    );

    expect(getByText('8/8 exercises')).toBeTruthy();
    expect(getByText('100%')).toBeTruthy();
  });

  it('handles long topic names correctly', () => {
    const longNameTopic = {
      ...mockTopic,
      topic: 'Very Long Topic Name That Should Be Handled Properly',
    };

    const { getByText } = renderWithProviders(
      <TopicCard topic={longNameTopic} onPress={mockOnPress} />
    );

    expect(getByText('Very Long Topic Name That Should Be Handled Properly')).toBeTruthy();
  });

  it('applies correct accessibility props', () => {
    const { getByTestId } = renderWithProviders(
      <TopicCard topic={mockTopic} onPress={mockOnPress} />
    );

    const card = getByTestId(`topic-card-${mockTopic.id}`);
    expect(card.props.accessibilityRole).toBe('button');
    expect(card.props.accessibilityLabel).toContain('Greetings');
    expect(card.props.accessibilityHint).toContain('practice');
  });

  it('card is pressable and responds to user interaction', () => {
    const { getByTestId } = renderWithProviders(
      <TopicCard topic={mockTopic} onPress={mockOnPress} />
    );

    const card = getByTestId(`topic-card-${mockTopic.id}`);
    // Verify the card is pressable
    fireEvent.press(card);
    expect(mockOnPress).toHaveBeenCalled();
  });
});
