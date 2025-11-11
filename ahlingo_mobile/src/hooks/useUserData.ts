import { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import {
  getMostRecentUser,
  getUserSettings,
  getUserId,
  UserSettings,
} from '../services/UserService';

/**
 * Custom hook for loading user data (settings, ID, etc.)
 */
export const useUserData = () => {
  const { settings: reduxSettings } = useSelector(
    (state: RootState) => state.settings
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string>('default_user');
  const [userSettings, setUserSettings] = useState<UserSettings>({});
  const [userId, setUserId] = useState<number | null>(null);
  const [language, setLanguage] = useState<string>('French');
  const [difficulty, setDifficulty] = useState<string>('Beginner');

  const loadUserData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const currentUsername = await getMostRecentUser();
      setUsername(currentUsername);

      // Get user settings
      const settings = await getUserSettings(currentUsername);
      setUserSettings(settings);

      // Get user ID
      const id = await getUserId(currentUsername);
      setUserId(id);

      // Determine effective language and difficulty
      const effectiveLanguage =
        settings.language || reduxSettings.language || 'French';
      const effectiveDifficulty =
        settings.difficulty || reduxSettings.difficulty || 'Beginner';

      setLanguage(effectiveLanguage);
      setDifficulty(effectiveDifficulty);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to load user data';
      setError(errorMessage);
      console.error('Failed to load user data:', err);
    } finally {
      setLoading(false);
    }
  }, [reduxSettings.language, reduxSettings.difficulty]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return {
    loading,
    error,
    username,
    userSettings,
    userId,
    language,
    difficulty,
    reload: loadUserData,
  };
};
