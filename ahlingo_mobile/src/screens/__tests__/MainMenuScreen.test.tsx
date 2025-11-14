import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, createMockNavigationProp } from '../../test-utils';
import MainMenuScreen from '../MainMenuScreen';
import { mockTheme } from '../../test-utils/mocks';

jest.mock('../../services/RefactoredDatabaseService', () => ({
  __esModule: true,
  getUserSettings: jest.fn(),
  getMostRecentUser: jest.fn(),
  setUserSetting: jest.fn(),
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
  getUserSettings: mockGetUserSettings,
  getMostRecentUser: mockGetMostRecentUser,
} = jest.requireMock('../../services/RefactoredDatabaseService');

describe('MainMenuScreen', () => {
  const navigation = createMockNavigationProp();

  beforeEach(() => {
    navigation.navigate.mockClear();
    navigation.goBack.mockClear();
    mockGetUserSettings.mockReset();
    mockGetUserSettings.mockResolvedValue({
      language: 'French',
      difficulty: 'Beginner',
      server_url: 'https://example.com',
      enable_local_models: 'true',
    });
    mockGetMostRecentUser.mockReset();
    mockGetMostRecentUser.mockResolvedValue('testuser');
  });

  it('renders the title and exercise cards grid', () => {
    const { getByTestId } = renderWithProviders(
      <MainMenuScreen navigation={navigation as any} />
    );

    expect(getByTestId('app-title').props.children).toBe('AHLingo');
    expect(getByTestId('exercise-match-words')).toBeTruthy();
    expect(getByTestId('settings-button')).toBeTruthy();
  });

  it('navigates to TopicSelection when Match Words card is pressed', async () => {
    const { getByTestId } = renderWithProviders(
      <MainMenuScreen navigation={navigation as any} />
    );

    fireEvent.press(getByTestId('exercise-match-words'));

    await waitFor(() => {
      expect(navigation.navigate).toHaveBeenCalledWith('TopicSelection', {
        exerciseType: 'pairs',
      });
    });
  });

  it('opens settings when the settings button is pressed', () => {
    const { getByTestId } = renderWithProviders(
      <MainMenuScreen navigation={navigation as any} />
    );

    fireEvent.press(getByTestId('settings-button'));

    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });
});
