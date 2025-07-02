import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { 
  setSettings, 
  setLoading, 
  setError 
} from '../store/slices/settingsSlice';
import {
  getLanguages,
  getDifficulties,
  getMostRecentUser,
  getUserSettings,
  setUserSetting,
  updateUserLogin,
} from '../services/SimpleDatabaseService';
import { Language, Difficulty } from '../types';
import { DropdownItem } from '../components/Dropdown';
import { getAvailableThemes, ThemeVariant } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

export interface FormData {
  language: string;
  difficulty: string;
  apiKey: string;
  serverUrl: string;
  username: string;
  theme: string;
  enableLocalModels: boolean;
  preferLocalModels: boolean;
}

interface UseSettingsFormReturn {
  // State
  formData: FormData;
  languages: DropdownItem[];
  difficulties: DropdownItem[];
  themes: DropdownItem[];
  isSaving: boolean;
  
  // Functions
  updateFormData: (field: keyof FormData, value: string | boolean) => void;
  handleSave: () => Promise<void>;
  loadInitialData: () => Promise<void>;
}

export const useSettingsForm = (): UseSettingsFormReturn => {
  const dispatch = useDispatch();
  const { themeVariant, setTheme } = useTheme();

  const [formData, setFormData] = useState<FormData>({
    language: 'French',
    difficulty: 'Beginner',
    apiKey: '',
    serverUrl: '',
    username: 'default_user',
    theme: themeVariant,
    enableLocalModels: false,
    preferLocalModels: false,
  });

  const [languages, setLanguages] = useState<DropdownItem[]>([]);
  const [difficulties, setDifficulties] = useState<DropdownItem[]>([]);
  const [themes] = useState<DropdownItem[]>(
    getAvailableThemes().map(theme => ({
      label: `${theme.name} - ${theme.description}`,
      value: theme.key,
    }))
  );
  const [isSaving, setIsSaving] = useState(false);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    dispatch(setLoading(true));

    try {
      // Load languages from database
      const languagesData = await getLanguages();
      const languageItems: DropdownItem[] = languagesData.map(
        (lang: Language) => ({
          label: lang.language,
          value: lang.language,
        })
      );

      // Fallback if no languages in database
      if (languageItems.length === 0) {
        languageItems.push(
          { label: 'French', value: 'French' },
          { label: 'Spanish', value: 'Spanish' },
          { label: 'German', value: 'German' }
        );
      }
      setLanguages(languageItems);

      // Load difficulties from database
      const difficultiesData = await getDifficulties();
      const difficultyItems: DropdownItem[] = difficultiesData.map(
        (diff: Difficulty) => ({
          label: diff.difficulty_level,
          value: diff.difficulty_level,
        })
      );

      // Fallback if no difficulties in database
      if (difficultyItems.length === 0) {
        difficultyItems.push(
          { label: 'Beginner', value: 'Beginner' },
          { label: 'Intermediate', value: 'Intermediate' },
          { label: 'Advanced', value: 'Advanced' }
        );
      }
      setDifficulties(difficultyItems);

      // Load user settings
      await loadUserSettings();
    } catch (error) {
      console.error('Failed to load initial data:', error);
      dispatch(setError('Failed to load settings data'));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadUserSettings = async () => {
    try {
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);

      setFormData({
        language: userSettings.language || 'French',
        difficulty: userSettings.difficulty || 'Beginner',
        apiKey: userSettings.api_key || '',
        serverUrl: userSettings.server_url || '',
        username: username,
        theme: themeVariant,
        enableLocalModels: userSettings.enable_local_models === 'true' || false,
        preferLocalModels: userSettings.prefer_local_models === 'true' || false,
      });

      // Update Redux store
      dispatch(
        setSettings({
          language: userSettings.language || 'French',
          difficulty: userSettings.difficulty || 'Beginner',
          enableLocalModels: userSettings.enable_local_models === 'true' || false,
          preferLocalModels: userSettings.prefer_local_models === 'true' || false,
        })
      );
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const username = formData.username || 'default_user';

      // Save all settings to database
      await setUserSetting(username, 'language', formData.language);
      await setUserSetting(username, 'difficulty', formData.difficulty);
      await setUserSetting(username, 'api_key', formData.apiKey);
      await setUserSetting(username, 'server_url', formData.serverUrl);
      await setUserSetting(username, 'enable_local_models', formData.enableLocalModels.toString());
      await setUserSetting(username, 'prefer_local_models', formData.preferLocalModels.toString());

      // Apply theme change immediately (this will also save to database)
      await setTheme(formData.theme as ThemeVariant);

      // Update user login timestamp
      await updateUserLogin(username);

      // Update Redux store
      dispatch(
        setSettings({
          language: formData.language,
          difficulty: formData.difficulty,
          enableLocalModels: formData.enableLocalModels,
          preferLocalModels: formData.preferLocalModels,
        })
      );

      Alert.alert('Success', 'Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return {
    // State
    formData,
    languages,
    difficulties,
    themes,
    isSaving,
    
    // Functions
    updateFormData,
    handleSave,
    loadInitialData,
  };
};