import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import { NavigationProp } from '@react-navigation/native';
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
  resetUserData,
  resetAppCompletely,
} from '../services/RefactoredDatabaseService';
import { Language, Difficulty, RootStackParamList } from '../types';
import { DropdownItem } from '../components/Dropdown';
import { getAvailableThemes, ThemeVariant } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';
import { ModelService } from '../services/ModelService';

export interface FormData {
  language: string;
  difficulty: string;
  apiKey: string;
  serverUrl: string;
  serverModel: string;
  username: string;
  theme: string;
  enableLocalModels: boolean;
  preferLocalModels: boolean;
  preferredVoices: { [languageCode: string]: string };
}
export type ServerConnectionStatus = 'idle' | 'checking' | 'success' | 'error';

export interface ServerStatusState {
  status: ServerConnectionStatus;
  message?: string;
}

interface UseSettingsFormReturn {
  // State
  formData: FormData;
  languages: DropdownItem[];
  difficulties: DropdownItem[];
  themes: DropdownItem[];
  isResetting: boolean;
  serverStatus: ServerStatusState;
  serverModelOptions: DropdownItem[];

  // Functions
  updateFormData: (field: keyof FormData, value: string | boolean) => void;
  handleReset: () => Promise<void>;
  loadInitialData: () => Promise<void>;
  refreshServerModels: () => void;
}

export const useSettingsForm = (navigation?: NavigationProp<RootStackParamList>): UseSettingsFormReturn => {
  const dispatch = useDispatch();
  const { themeVariant, setTheme } = useTheme();

  const [formData, setFormData] = useState<FormData>({
    language: 'French',
    difficulty: 'Beginner',
    apiKey: '',
    serverUrl: '',
    serverModel: '',
    username: 'default_user',
    theme: themeVariant,
    enableLocalModels: false,
    preferLocalModels: false,
    preferredVoices: {},
  });

  const [languages, setLanguages] = useState<DropdownItem[]>([]);
  const [difficulties, setDifficulties] = useState<DropdownItem[]>([]);
  const [themes] = useState<DropdownItem[]>(
    getAvailableThemes().map(theme => ({
      label: `${theme.name} - ${theme.description}`,
      value: theme.key,
    }))
  );
  const [isResetting, setIsResetting] = useState(false);
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatusState>({ status: 'idle' });
  const [serverModelOptions, setServerModelOptions] = useState<DropdownItem[]>([]);
  const [serverRefreshKey, setServerRefreshKey] = useState(0);

  const dedupeDropdownItems = useCallback((items: DropdownItem[]): DropdownItem[] => {
    const seen = new Set<string>();
    const result: DropdownItem[] = [];
    items.forEach(item => {
      if (!seen.has(item.value)) {
        seen.add(item.value);
        result.push(item);
      }
    });
    return result;
  }, []);

  // Load initial data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Auto-save when form data changes (after initial load)
  useEffect(() => {
    if (initialFormData) {
      const hasChanges = Object.keys(formData).some(key => {
        const formKey = key as keyof FormData;
        return formData[formKey] !== initialFormData[formKey];
      });

      if (hasChanges) {
        // Auto-save the changes
        handleAutoSave();
      }
    }
  }, [formData, initialFormData]);

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
      const fallbackLanguages: DropdownItem[] = languageItems.length === 0
        ? [
            { label: 'French', value: 'French' },
            { label: 'Spanish', value: 'Spanish' },
            { label: 'German', value: 'German' },
          ]
        : languageItems;
      const languagesWithEnglish = fallbackLanguages.some(item => item.value.toLowerCase() === 'english')
        ? fallbackLanguages
        : [{ label: 'English', value: 'English' }, ...fallbackLanguages];
      setLanguages(dedupeDropdownItems(languagesWithEnglish));

      // Load difficulties from database
      const difficultiesData = await getDifficulties();
      const difficultyItems: DropdownItem[] = difficultiesData.map(
        (diff: Difficulty) => ({
          label: diff.difficulty_level,
          value: diff.difficulty_level,
        })
      );

      // Fallback if no difficulties in database
      const fallbackDifficulties = difficultyItems.length === 0
        ? [
            { label: 'Beginner', value: 'Beginner' },
            { label: 'Intermediate', value: 'Intermediate' },
            { label: 'Advanced', value: 'Advanced' },
          ]
        : difficultyItems;
      setDifficulties(dedupeDropdownItems(fallbackDifficulties));

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

      // Parse preferred voices from JSON string
      let preferredVoices = {};
      if (userSettings.preferred_voices) {
        try {
          preferredVoices = JSON.parse(userSettings.preferred_voices);
        } catch (e) {
          console.warn('Failed to parse preferred voices:', e);
        }
      }

      const loadedFormData = {
        language: userSettings.language || 'French',
        difficulty: userSettings.difficulty || 'Beginner',
        apiKey: userSettings.api_key || '',
        serverUrl: userSettings.server_url || '',
        serverModel: userSettings.server_model || '',
        username: username,
        theme: themeVariant,
        enableLocalModels: userSettings.enable_local_models === 'true' || false,
        preferLocalModels: userSettings.prefer_local_models === 'true' || false,
        preferredVoices: preferredVoices,
      };

      setFormData(loadedFormData);
      setInitialFormData(loadedFormData);

      // Update Redux store
      dispatch(
        setSettings({
          language: userSettings.language || 'French',
          difficulty: userSettings.difficulty || 'Beginner',
          enableLocalModels: userSettings.enable_local_models === 'true' || false,
          preferLocalModels: userSettings.prefer_local_models === 'true' || false,
          preferredVoices: preferredVoices,
        })
      );
    } catch (error) {
      console.error('Failed to load user settings:', error);
    }
  };


  const handleAutoSave = async () => {
    try {
      const username = formData.username || 'default_user';

      // Save all settings to database silently
      await setUserSetting(username, 'language', formData.language);
      await setUserSetting(username, 'difficulty', formData.difficulty);
      await setUserSetting(username, 'api_key', formData.apiKey);
      await setUserSetting(username, 'server_url', formData.serverUrl);
      await setUserSetting(username, 'server_model', formData.serverModel);
      await setUserSetting(username, 'enable_local_models', formData.enableLocalModels.toString());
      await setUserSetting(username, 'prefer_local_models', formData.preferLocalModels.toString());
      await setUserSetting(username, 'preferred_voices', JSON.stringify(formData.preferredVoices));

      // Apply theme change immediately
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
          preferredVoices: formData.preferredVoices,
        })
      );

      setInitialFormData({ ...formData }); // Update initial data after successful save
    } catch (error) {
      console.error('Failed to auto-save settings:', error);
      // Show error only if auto-save fails
      Alert.alert('Error', 'Failed to save settings automatically. Please try again.');
    }
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      // Complete app reset - delete all users and data
      await resetAppCompletely();

      // Clear Redux store
      dispatch(setSettings({
        language: '',
        difficulty: '',
        userId: 1,
        enableLocalModels: false,
        preferLocalModels: false,
      }));

      // Navigate to Welcome screen for fresh setup
      if (navigation) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
      }
    } catch (error) {
      console.error('Failed to reset app completely:', error);
      Alert.alert('Error', 'Failed to reset app data. Please try again.');
    } finally {
      setIsResetting(false);
    }
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const refreshServerModels = () => {
    setServerRefreshKey(prev => prev + 1);
  };

  useEffect(() => {
    let isCancelled = false;
    const url = formData.serverUrl?.trim() || '';

    if (!url) {
      setServerStatus({ status: 'idle' });
      setServerModelOptions([]);
      setFormData(prev => (prev.serverModel ? { ...prev, serverModel: '' } : prev));
      return undefined;
    }

    setServerStatus({ status: 'checking' });
    const timeoutId = setTimeout(() => {
      ModelService.fetchAvailableModels(url, formData.apiKey)
        .then(models => {
          if (isCancelled) return;
          const options = dedupeDropdownItems(models.map(model => ({
            label: model.name || model.id,
            value: model.id,
          })));
          setServerModelOptions(options);
          setServerStatus({
            status: 'success',
            message: `${models.length} model${models.length === 1 ? '' : 's'} available`,
          });
          setFormData(prev => {
            if (models.length === 0) {
              return prev.serverModel ? { ...prev, serverModel: '' } : prev;
            }

            const hasSelected = prev.serverModel
              && models.some(m => m.id === prev.serverModel);

            if (hasSelected) {
              return prev;
            }

            return { ...prev, serverModel: models[0].id };
          });
        })
        .catch(error => {
          if (isCancelled) return;
          const errorMessage = error instanceof Error ? error.message : 'Failed to reach server';
          setServerStatus({ status: 'error', message: errorMessage });
          setServerModelOptions([]);
          setFormData(prev => (prev.serverModel ? { ...prev, serverModel: '' } : prev));
        });
    }, 600);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [formData.serverUrl, formData.apiKey, serverRefreshKey, dedupeDropdownItems]);

  return {
    // State
    formData,
    languages,
    difficulties,
    themes,
    isResetting,
    serverStatus,
    serverModelOptions,

    // Functions
    updateFormData,
    handleReset,
    loadInitialData,
    refreshServerModels,
  };
};
