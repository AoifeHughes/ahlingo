import { useEffect, useState } from 'react';
import DatabaseService from './DatabaseService';
import { Language, Topic, Difficulty } from '../types';

export const useDatabaseService = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dbService = DatabaseService.getInstance();

  useEffect(() => {
    const initDB = async () => {
      try {
        await dbService.initializeDatabase();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Database initialization failed');
        console.error('Database initialization error:', err);
      }
    };

    initDB();

    return () => {
      // Cleanup on unmount
      dbService.closeDatabase();
    };
  }, []);

  return {
    isInitialized,
    error,
    dbService,
  };
};

export const useLanguages = () => {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized, dbService } = useDatabaseService();

  useEffect(() => {
    if (!isInitialized) return;

    const fetchLanguages = async () => {
      try {
        setLoading(true);
        const result = await dbService.getLanguages();
        setLanguages(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch languages');
      } finally {
        setLoading(false);
      }
    };

    fetchLanguages();
  }, [isInitialized]);

  return { languages, loading, error };
};

export const useTopics = (language?: string, difficulty?: string) => {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized, dbService } = useDatabaseService();

  useEffect(() => {
    if (!isInitialized) return;

    const fetchTopics = async () => {
      try {
        setLoading(true);
        let result: Topic[];
        
        if (language && difficulty) {
          result = await dbService.getTopicsByLanguageAndDifficulty(language, difficulty);
        } else {
          result = await dbService.getTopics();
        }
        
        setTopics(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch topics');
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [isInitialized, language, difficulty]);

  return { topics, loading, error };
};

export const useDifficulties = () => {
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized, dbService } = useDatabaseService();

  useEffect(() => {
    if (!isInitialized) return;

    const fetchDifficulties = async () => {
      try {
        setLoading(true);
        const result = await dbService.getDifficulties();
        setDifficulties(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch difficulties');
      } finally {
        setLoading(false);
      }
    };

    fetchDifficulties();
  }, [isInitialized]);

  return { difficulties, loading, error };
};

export const useUserSettings = (username: string) => {
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isInitialized, dbService } = useDatabaseService();

  useEffect(() => {
    if (!isInitialized || !username) return;

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const result = await dbService.getUserSettings(username);
        setSettings(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch user settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [isInitialized, username]);

  const updateSetting = async (settingName: string, settingValue: string) => {
    try {
      await dbService.setUserSetting(username, settingName, settingValue);
      setSettings(prev => ({ ...prev, [settingName]: settingValue }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update setting');
      throw err;
    }
  };

  return { settings, loading, error, updateSetting };
};