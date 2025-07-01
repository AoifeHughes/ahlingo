import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Button } from 'react-native-elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { RootStackParamList, Language, Difficulty, LocalModel, LocalModelDownloadProgress } from '../types';
import { RootState } from '../store';
import {
  setSettings,
  setLoading,
  setError,
  setEnableLocalModels,
  setPreferLocalModels,
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
import LocalLlamaService from '../services/LocalLlamaService';
import { ModelService } from '../services/ModelService';

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
  enableLocalModels: boolean;
  preferLocalModels: boolean;
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
  
  // Local model state
  const [availableLocalModels, setAvailableLocalModels] = useState<LocalModel[]>([]);
  const [downloadedModels, setDownloadedModels] = useState<LocalModel[]>([]);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, LocalModelDownloadProgress>>({});
  const [isLoadingLocalModels, setIsLoadingLocalModels] = useState(false);
  const [storageUsage, setStorageUsage] = useState<{ totalSize: number; modelCount: number }>({ totalSize: 0, modelCount: 0 });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (formData.enableLocalModels) {
      loadLocalModels();
    }
  }, [formData.enableLocalModels]);

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

  // Local model management functions
  const loadLocalModels = async () => {
    setIsLoadingLocalModels(true);
    try {
      const available = LocalLlamaService.getAvailableModels();
      const downloaded = await LocalLlamaService.getDownloadedModels();
      const usage = await LocalLlamaService.getStorageUsage();
      
      setAvailableLocalModels(available);
      setDownloadedModels(downloaded);
      setStorageUsage(usage);
    } catch (error) {
      console.error('Failed to load local models:', error);
    } finally {
      setIsLoadingLocalModels(false);
    }
  };

  const downloadModel = async (modelId: string) => {
    try {
      console.log('🚀 Starting download for model:', modelId);
      
      // Initialize progress state
      setDownloadProgress(prev => ({
        ...prev,
        [modelId]: { modelId, progress: 0, bytesWritten: 0, contentLength: 0 }
      }));

      await LocalLlamaService.downloadModel(modelId, (progressData) => {
        console.log('📊 Progress update received:', {
          modelId: progressData.modelId,
          progress: progressData.progress,
          percentage: Math.round(progressData.progress * 100),
          bytesWritten: progressData.bytesWritten,
          contentLength: progressData.contentLength
        });
        
        // Use callback form of setState to ensure we get the latest state
        setDownloadProgress(prev => {
          const updated = {
            ...prev,
            [modelId]: {
              ...progressData,
              timestamp: Date.now() // Add timestamp for debugging
            }
          };
          console.log('📊 Updated progress state:', updated[modelId]);
          return updated;
        });
      });

      console.log('✅ Download completed for model:', modelId);
      
      // Refresh models list
      await loadLocalModels();
      
      // Clear progress
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelId];
        return newProgress;
      });

      Alert.alert('Success', 'Model downloaded successfully!');
    } catch (error) {
      console.error('❌ Failed to download model:', error);
      Alert.alert('Error', `Failed to download model: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Clear progress on error
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[modelId];
        return newProgress;
      });
    }
  };

  const deleteModel = async (modelId: string) => {
    try {
      Alert.alert(
        'Delete Model',
        'Are you sure you want to delete this model? This will free up storage space.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              try {
                await LocalLlamaService.deleteModel(modelId);
                await loadLocalModels();
                Alert.alert('Success', 'Model deleted successfully!');
              } catch (error) {
                console.error('Failed to delete model:', error);
                Alert.alert('Error', `Failed to delete model: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error in delete model:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1) {
      return `${gb.toFixed(1)} GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)} MB`;
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

          <SettingsItem title="Local Models">
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Enable Local Models</Text>
              <Switch
                value={formData.enableLocalModels}
                onValueChange={value => updateFormData('enableLocalModels', value)}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={formData.enableLocalModels ? '#f5dd4b' : '#f4f3f4'}
              />
            </View>
            <Text style={styles.helpText}>
              Run AI models locally on your device for privacy and offline use
            </Text>
          </SettingsItem>

          {formData.enableLocalModels && (
            <>
              <SettingsItem title="Prefer Local Models">
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>Prefer Local Over Remote</Text>
                  <Switch
                    value={formData.preferLocalModels}
                    onValueChange={value => updateFormData('preferLocalModels', value)}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={formData.preferLocalModels ? '#f5dd4b' : '#f4f3f4'}
                  />
                </View>
                <Text style={styles.helpText}>
                  Use local models when available instead of remote models
                </Text>
              </SettingsItem>

              <SettingsItem title="Local Model Storage">
                <View style={styles.storageInfo}>
                  <Text style={styles.storageText}>
                    Storage Used: {formatFileSize(storageUsage.totalSize)}
                  </Text>
                  <Text style={styles.storageText}>
                    Models Downloaded: {storageUsage.modelCount}
                  </Text>
                  <TouchableOpacity style={styles.refreshButton} onPress={loadLocalModels}>
                    <Text style={styles.refreshButtonText}>Refresh</Text>
                  </TouchableOpacity>
                </View>
              </SettingsItem>

              <SettingsItem title="Available Models">
                {isLoadingLocalModels ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <View style={styles.modelsContainer}>
                    {/* Debug info - remove in production */}
                    {Object.keys(downloadProgress).length > 0 && (
                      <View style={styles.debugContainer}>
                        <Text style={styles.debugText}>
                          Active Downloads: {JSON.stringify(downloadProgress, null, 2)}
                        </Text>
                      </View>
                    )}
                    {availableLocalModels.map((item) => {
                      const isDownloaded = downloadedModels.some(d => d.id === item.id);
                      const progress = downloadProgress[item.id];
                      const isDownloading = !!progress;

                      return (
                        <View key={item.id} style={styles.modelItem}>
                          <View style={styles.modelInfo}>
                            <Text style={styles.modelName}>{item.name}</Text>
                            <Text style={styles.modelDescription}>
                              {item.description} • {formatFileSize(item.fileSize || 0)}
                            </Text>
                            {isDownloading && (
                              <View style={styles.progressContainer}>
                                <Text style={styles.progressText}>
                                  Downloading: {Math.round((progress?.progress || 0) * 100)}%
                                  {progress?.bytesWritten && progress?.contentLength && (
                                    <Text style={styles.progressDetails}>
                                      {' '}({formatFileSize(progress.bytesWritten)} / {formatFileSize(progress.contentLength)})
                                    </Text>
                                  )}
                                </Text>
                                <View style={styles.progressBar}>
                                  <View 
                                    style={[
                                      styles.progressFill, 
                                      { width: `${Math.max(0, Math.min(100, (progress?.progress || 0) * 100))}%` }
                                    ]} 
                                  />
                                </View>
                              </View>
                            )}
                          </View>
                          <View style={styles.modelActions}>
                            {isDownloaded ? (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => deleteModel(item.id)}
                              >
                                <Text style={styles.deleteButtonText}>Delete</Text>
                              </TouchableOpacity>
                            ) : (
                              <TouchableOpacity
                                style={[styles.actionButton, styles.downloadButton]}
                                onPress={() => downloadModel(item.id)}
                                disabled={isDownloading}
                              >
                                <Text style={styles.downloadButtonText}>
                                  {isDownloading ? 'Downloading...' : 'Download'}
                                </Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </SettingsItem>
            </>
          )}

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
  // Local model styles
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: currentTheme.spacing.sm,
  },
  switchLabel: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.text,
    flex: 1,
  },
  storageInfo: {
    backgroundColor: currentTheme.colors.surfaceDark,
    padding: currentTheme.spacing.md,
    borderRadius: currentTheme.borderRadius.base,
    marginBottom: currentTheme.spacing.sm,
  },
  storageText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.xs,
  },
  refreshButton: {
    backgroundColor: currentTheme.colors.primary,
    paddingHorizontal: currentTheme.spacing.md,
    paddingVertical: currentTheme.spacing.xs,
    borderRadius: currentTheme.borderRadius.sm,
    alignSelf: 'flex-start',
    marginTop: currentTheme.spacing.xs,
  },
  refreshButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.sm,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  modelsContainer: {
    maxHeight: 300,
  },
  modelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.md,
    marginBottom: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: currentTheme.colors.border,
  },
  modelInfo: {
    flex: 1,
    marginRight: currentTheme.spacing.md,
  },
  modelName: {
    fontSize: currentTheme.typography.fontSizes.base,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.xs,
  },
  modelDescription: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.xs,
  },
  progressContainer: {
    marginTop: currentTheme.spacing.sm,
  },
  progressText: {
    fontSize: currentTheme.typography.fontSizes.xs,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.xs,
  },
  progressDetails: {
    fontSize: currentTheme.typography.fontSizes.xs,
    color: currentTheme.colors.textLight,
    fontStyle: 'italic',
  },
  progressBar: {
    height: 4,
    backgroundColor: currentTheme.colors.borderLight,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: currentTheme.colors.primary,
  },
  modelActions: {
    justifyContent: 'center',
  },
  actionButton: {
    paddingHorizontal: currentTheme.spacing.md,
    paddingVertical: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  downloadButton: {
    backgroundColor: currentTheme.colors.success,
  },
  downloadButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.sm,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  deleteButton: {
    backgroundColor: currentTheme.colors.error,
  },
  deleteButtonText: {
    color: currentTheme.colors.background,
    fontSize: currentTheme.typography.fontSizes.sm,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
  // Debug styles - remove in production
  debugContainer: {
    backgroundColor: currentTheme.colors.warning,
    padding: currentTheme.spacing.sm,
    marginBottom: currentTheme.spacing.sm,
    borderRadius: currentTheme.borderRadius.sm,
  },
  debugText: {
    fontSize: currentTheme.typography.fontSizes.xs,
    color: currentTheme.colors.text,
    fontFamily: 'monospace',
  },
});

export default SettingsScreen;
