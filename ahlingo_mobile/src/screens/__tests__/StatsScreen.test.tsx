import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils';
import StatsScreen from '../StatsScreen';
import { mockTheme } from '../../test-utils/mocks';

jest.mock('../../services/RefactoredDatabaseService', () => ({
  __esModule: true,
  getMostRecentUser: jest.fn(),
  getUserSettings: jest.fn(),
  getUserId: jest.fn(),
  getUserStatsAndSummary: jest.fn(),
}));

jest.mock('../../contexts/ThemeContext', () => ({
  ThemeProvider: ({ children }: any) => children,
  useTheme: () => ({
    theme: mockTheme,
    themeVariant: 'frost',
    setTheme: jest.fn(),
  }),
}));

const {
  getMostRecentUser,
  getUserSettings,
  getUserId,
  getUserStatsAndSummary,
} = jest.requireMock('../../services/RefactoredDatabaseService');

describe('StatsScreen', () => {
  beforeEach(() => {
    getMostRecentUser.mockReset();
    getUserSettings.mockReset();
    getUserId.mockReset();
    getUserStatsAndSummary.mockReset();
  });

  it('renders loading state then loads stats', async () => {
    getMostRecentUser.mockResolvedValue('testuser');
    getUserSettings.mockResolvedValue({ language: 'French', difficulty: 'Beginner' });
    getUserId.mockResolvedValue(1);
    getUserStatsAndSummary.mockResolvedValue({
      stats: [
        {
          topic: 'Basic questions',
          topic_id: 1,
          attempted_exercises: 5,
          correct_exercises: 3,
          total_exercises: 5,
          completion_percentage: 60,
        },
      ],
      summary: {
        total_attempted: 5,
        total_correct: 3,
        total_available: 10,
        overall_completion_percentage: 50,
        success_rate: 60,
      },
    });

    const { getByText } = renderWithProviders(<StatsScreen navigation={{} as any} />);

    await waitFor(() => expect(getByText('Overall Progress')).toBeTruthy());
    expect(getByText('Showing French • Beginner Level')).toBeTruthy();
    expect(getByText('Completed')).toBeTruthy();
    expect(getByText('Attempted')).toBeTruthy();
    expect(getByText('Available')).toBeTruthy();
    expect(getByText('Progress by Topic')).toBeTruthy();
    expect(getByText('Basic questions')).toBeTruthy();
    expect(getByText('Attempted: 5 exercises')).toBeTruthy();
  });
});
