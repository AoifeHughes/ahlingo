import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
} from 'react-native';
import { Button } from 'react-native-elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../types';
import { RootState } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import { useSettingsForm } from '../hooks/useSettingsForm';
import { useLocalModels } from '../hooks/useLocalModels';
import BasicSettingsForm from '../components/settings/BasicSettingsForm';
import LocalModelsSection from '../components/settings/LocalModelsSection';

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { isLoading } = useSelector((state: RootState) => state.settings);
  const { theme } = useTheme();

  // Use custom hooks for state management
  const {
    formData,
    languages,
    difficulties,
    themes,
    isSaving,
    updateFormData,
    handleSave,
  } = useSettingsForm();

  const localModelsHook = useLocalModels(formData.enableLocalModels);

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
          <BasicSettingsForm
            formData={formData}
            languages={languages}
            difficulties={difficulties}
            themes={themes}
            onUpdateFormData={updateFormData}
            theme={theme}
          />

          <LocalModelsSection
            enableLocalModels={formData.enableLocalModels}
            preferLocalModels={formData.preferLocalModels}
            onUpdateFormData={updateFormData}
            {...localModelsHook}
            theme={theme}
          />

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
});

export default SettingsScreen;