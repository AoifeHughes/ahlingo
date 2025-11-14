import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders, createMockNavigationProp } from '../../test-utils';
import WelcomeScreen from '../WelcomeScreen';
import { sampleLanguages, sampleDifficulties } from '../../test-utils/databaseSample';
import { mockTheme } from '../../test-utils/mocks';

jest.mock('../../services/RefactoredDatabaseService', () => ({
  __esModule: true,
  getLanguages: jest.fn(),
  getDifficulties: jest.fn(),
  getUserId: jest.fn(),
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
  getLanguages: mockGetLanguages,
  getDifficulties: mockGetDifficulties,
  getUserId: mockGetUserId,
  setUserSetting: mockSetUserSetting,
} = jest.requireMock('../../services/RefactoredDatabaseService');

describe('WelcomeScreen', () => {
  const navigation = {
    ...createMockNavigationProp(),
    reset: jest.fn(),
  } as any;

  beforeEach(() => {
    navigation.reset.mockClear();
    mockGetLanguages.mockReset();
    mockGetLanguages.mockResolvedValue(sampleLanguages);
    mockGetDifficulties.mockReset();
    mockGetDifficulties.mockResolvedValue(sampleDifficulties);
    mockGetUserId.mockReset();
    mockSetUserSetting.mockReset();
  });

  it('renders welcome copy with language and difficulty options', async () => {
    const { getByText } = renderWithProviders(
      <WelcomeScreen navigation={navigation} />
    );

    await waitFor(() => expect(getByText('Welcome to AHLingo! 🎉')).toBeTruthy());

    expect(getByText('French')).toBeTruthy();
    expect(getByText('Beginner')).toBeTruthy();
  });

  it('saves settings and navigates when Get Started is pressed', async () => {
    mockGetUserId.mockResolvedValue(42);
    mockSetUserSetting.mockResolvedValue(undefined);

    const { getByText } = renderWithProviders(
      <WelcomeScreen navigation={navigation} />
    );

    await waitFor(() => expect(getByText('Get Started')).toBeTruthy());
    fireEvent.press(getByText('Get Started'));

    await waitFor(() => {
      expect(mockGetUserId).toHaveBeenCalledWith('default_user');
      expect(mockSetUserSetting).toHaveBeenCalledWith('default_user', 'language', 'French');
      expect(mockSetUserSetting).toHaveBeenCalledWith('default_user', 'difficulty', 'Beginner');
      expect(mockSetUserSetting).toHaveBeenCalledWith('default_user', 'has_completed_welcome', 'true');
      expect(navigation.reset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'MainMenu' }],
      });
    });
  });
});
