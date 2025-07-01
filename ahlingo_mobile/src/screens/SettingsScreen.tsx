import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button } from 'react-native-elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList, Language, Difficulty } from '../types';
import { RootState } from '../store';
import {
  setSettings,
  setLoading,
  setError,
} from '../store/slices/settingsSlice';
import {
  getLanguages,
  getDifficulties,
  getMostRecentUser,
  getUserSettings,
  setUserSetting,
  updateUserLogin,
  logDatabaseTables,
} from '../services/SimpleDatabaseService';
import SettingsItem from '../components/SettingsItem';
import Dropdown, { DropdownItem } from '../components/Dropdown';
import { getAvailableThemes, ThemeVariant } from '../utils/theme';
import { useTheme } from '../contexts/ThemeContext';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

interface FormData {
  language: string;
  difficulty: string;
  apiKey: string;
  serverUrl: string;
  username: string;
  theme: string;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { settings, isLoading } = useSelector(
    (state: RootState) => state.settings
  );
  const { theme, themeVariant, setTheme } = useTheme();

  const [formData, setFormData] = useState<FormData>({
    language: 'French',
    difficulty: 'Beginner',
    apiKey: '',
    serverUrl: '',
    username: 'default_user',
    theme: themeVariant,
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
      });

      // Update Redux store
      dispatch(
        setSettings({
          language: userSettings.language || 'French',
          difficulty: userSettings.difficulty || 'Beginner',
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

      // Apply theme change immediately (this will also save to database)
      await setTheme(formData.theme as ThemeVariant);

      // Update user login timestamp
      await updateUserLogin(username);

      // Update Redux store
      dispatch(
        setSettings({
          language: formData.language,
          difficulty: formData.difficulty,
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

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isLoading) {
    const loadingStyles = createStyles(theme);
    return (
      <View style={loadingStyles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={loadingStyles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <SettingsItem title="Language">
            <Dropdown
              items={languages}
              selectedValue={formData.language}
              onValueChange={value => updateFormData('language', value)}
              placeholder="Select Language"
            />
          </SettingsItem>

          <SettingsItem title="Difficulty">
            <Dropdown
              items={difficulties}
              selectedValue={formData.difficulty}
              onValueChange={value => updateFormData('difficulty', value)}
              placeholder="Select Difficulty"
            />
          </SettingsItem>

          <SettingsItem title="Theme">
            <Dropdown
              items={themes}
              selectedValue={formData.theme}
              onValueChange={value => updateFormData('theme', value)}
              placeholder="Select Theme"
            />
          </SettingsItem>

          <SettingsItem title="API Key">
            <TextInput
              style={styles.textInput}
              value={formData.apiKey}
              onChangeText={value => updateFormData('apiKey', value)}
              placeholder="Enter API Key"
              secureTextEntry
            />
          </SettingsItem>

          <SettingsItem title="AI Server URL (include port)">
            <TextInput
              style={styles.textInput}
              value={formData.serverUrl}
              onChangeText={value => updateFormData('serverUrl', value)}
              placeholder="e.g., http://192.168.1.100:11434"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.helpText}>
              Enter the full URL including port number for your AI server (Ollama, etc.)
            </Text>
          </SettingsItem>

          <SettingsItem title="Username">
            <TextInput
              style={styles.textInput}
              value={formData.username}
              onChangeText={value => updateFormData('username', value)}
              placeholder="Enter Username"
              autoCapitalize="none"
            />
          </SettingsItem>

          <View style={styles.buttonContainer}>
            <Button
              title={isSaving ? 'Saving...' : 'Save Settings'}
              buttonStyle={styles.saveButton}
              titleStyle={styles.saveButtonText}
              onPress={handleSave}
              disabled={isSaving}
              loading={isSaving}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: currentTheme.colors.background,
  },
  loadingText: {
    marginTop: currentTheme.spacing.lg,
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: currentTheme.spacing.lg,
  },
  textInput: {
    backgroundColor: currentTheme.colors.surface,
    borderWidth: 1,
    borderColor: currentTheme.colors.border,
    borderRadius: currentTheme.borderRadius.base,
    paddingHorizontal: currentTheme.spacing.lg,
    paddingVertical: currentTheme.spacing.md,
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.text,
    minHeight: currentTheme.spacing['5xl'],
  },
  buttonContainer: {
    marginTop: currentTheme.spacing['3xl'],
    marginBottom: currentTheme.spacing['4xl'],
  },
  saveButton: {
    backgroundColor: currentTheme.colors.success,
    borderRadius: currentTheme.borderRadius.base,
    paddingVertical: currentTheme.spacing.lg,
    ...currentTheme.shadows.base,
  },
  saveButtonText: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
  },
  helpText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginTop: currentTheme.spacing.xs,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
