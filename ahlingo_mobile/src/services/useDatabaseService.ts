import { useEffect, useState } from 'react';
import {
  getLanguages,
  getTopics,
  getDifficulties,
  getUserSettings,
  setUserSetting
} from './SimpleDatabaseService';
import { Language, Topic, Difficulty } from '../types';

// Simple hook that assumes database is always ready
// since SimpleDatabaseService handles initialization per call
export const useDatabaseService = () => {
  return {
    isInitialized: true, // Always ready with SimpleDatabaseService
    error: null,
  };
};

export const useLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const result = await getLanguages();
        setLanguages(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch languages');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  return { languages, loading, error };
};

export const useTopics = (language?: string, difficulty?: string) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        // Note: For now just get all topics since getTopicsByLanguageAndDifficulty
        // isn't implemented in SimpleDatabaseService yet
        const result = await getTopics();
        setTopics(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [language, difficulty]);

  return { topics, loading, error };
};

export const useDifficulties = () => {
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDifficulties = async () => {
      try {
        setLoading(true);
        const result = await getDifficulties();
        setDifficulties(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch difficulties');
      } finally {
        setLoading(false);
      }
    };

    fetchDifficulties();
  }, []);

  return { difficulties, loading, error };
};

export const useUserSettings = (username: string) => {
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const result = await getUserSettings(username);
        setSettings(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [username]);

  const updateSetting = async (settingName: string, settingValue: string) => {
    try {
      await setUserSetting(username, settingName, settingValue);
      setSettings(prev => ({ ...prev, [settingName]: settingValue }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
      throw err;
    }
  };

  return { settings, loading, error, updateSetting };
};