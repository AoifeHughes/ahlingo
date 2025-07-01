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
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch();
  const { settings, isLoading } = useSelector(
    (state: RootState) => state.settings
  );

  const [formData, setFormData] = useState<FormData>({
    language: 'French',
    difficulty: 'Beginner',
    apiKey: '',
    serverUrl: '',
    username: 'default_user',
  });

  const [languages, setLanguages] = useState<DropdownItem[]>([]);
  const [difficulties, setDifficulties] = useState<DropdownItem[]>([]);
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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976D2" />
        <Text style={styles.loadingText}>Loading settings...</Text>
      </View>
    );
  }

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  textInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 48,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 32,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
