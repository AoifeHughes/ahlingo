import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  ActivityIndicator,
  Alert,
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
    isResetting,
    updateFormData,
    handleReset,
  } = useSettingsForm();

  const localModelsHook = useLocalModels(formData.enableLocalModels);

  const confirmReset = () => {
    Alert.alert(
      'Reset User Data',
      'Are you sure you want to reset all your progress and chat history? This action cannot be undone.\n\nThis will:\n• Clear all exercise progress\n• Delete chat history\n• Keep all lessons intact\n\nYour settings will remain unchanged.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: handleReset,
        },
      ]
    );
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

          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            <Text style={styles.dangerZoneDescription}>
              Reset your learning progress and chat history. This action cannot be undone.
            </Text>
            <Button
              title={isResetting ? 'Resetting...' : 'Reset User Data'}
              buttonStyle={styles.resetButton}
              titleStyle={styles.resetButtonText}
              onPress={confirmReset}
              disabled={isResetting}
              loading={isResetting}
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
  dangerZone: {
    marginTop: currentTheme.spacing['3xl'],
    marginBottom: currentTheme.spacing['4xl'],
    padding: currentTheme.spacing.lg,
    borderRadius: currentTheme.borderRadius.base,
    borderWidth: 1,
    borderColor: currentTheme.colors.error,
    backgroundColor: currentTheme.colors.surface,
  },
  dangerZoneTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.error,
    marginBottom: currentTheme.spacing.base,
  },
  dangerZoneDescription: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.lg,
    lineHeight: 20,
  },
  resetButton: {
    backgroundColor: currentTheme.colors.error,
    borderRadius: currentTheme.borderRadius.base,
    paddingVertical: currentTheme.spacing.lg,
    ...currentTheme.shadows.base,
  },
  resetButtonText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.surface,
  },
});

export default SettingsScreen;