import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import SettingsItem from '../SettingsItem';
import Dropdown, { DropdownItem } from '../Dropdown';
import { FormData, ServerStatusState } from '../../hooks/useSettingsForm';

interface BasicSettingsFormProps {
  formData: FormData;
  languages: DropdownItem[];
  difficulties: DropdownItem[];
  themes: DropdownItem[];
  serverStatus: ServerStatusState;
  serverModelOptions: DropdownItem[];
  onServerModelChange: (modelId: string) => void;
  refreshServerModels: () => void;
  onUpdateFormData: (field: keyof FormData, value: string | boolean) => void;
  theme: any;
}

const BasicSettingsForm: React.FC<BasicSettingsFormProps> = ({
  formData,
  languages,
  difficulties,
  themes,
  serverStatus,
  serverModelOptions,
  onServerModelChange,
  refreshServerModels,
  onUpdateFormData,
  theme,
}) => {
  const styles = createStyles(theme);

  return (
    <>
      <SettingsItem title="Language">
        <Dropdown
          items={languages}
          selectedValue={formData.language}
          onValueChange={value => onUpdateFormData('language', value)}
          placeholder="Select Language"
        />
      </SettingsItem>

      <SettingsItem title="Difficulty">
        <Dropdown
          items={difficulties}
          selectedValue={formData.difficulty}
          onValueChange={value => onUpdateFormData('difficulty', value)}
          placeholder="Select Difficulty"
        />
      </SettingsItem>

      <SettingsItem title="Theme">
        <Dropdown
          items={themes}
          selectedValue={formData.theme}
          onValueChange={value => onUpdateFormData('theme', value)}
          placeholder="Select Theme"
        />
      </SettingsItem>

      <SettingsItem title="API Key">
        <TextInput
          style={styles.textInput}
          value={formData.apiKey}
          onChangeText={value => onUpdateFormData('apiKey', value)}
          placeholder="Enter API Key"
          secureTextEntry
        />
      </SettingsItem>

      <SettingsItem title="AI Server URL (include port)">
        <TextInput
          style={styles.textInput}
          value={formData.serverUrl}
          onChangeText={value => onUpdateFormData('serverUrl', value)}
          placeholder="e.g., http://192.168.1.100:11434"
          keyboardType="url"
          autoCapitalize="none"
        />
        <Text style={styles.helpText}>
          Enter the full URL including port number for your AI server (Ollama, etc.)
        </Text>
        <View style={styles.serverStatusRow}>
          <View style={styles.serverStatusIndicator}>
            {serverStatus.status === 'checking' ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Text
                style={[
                  styles.serverStatusText,
                  serverStatus.status === 'success' && styles.serverStatusSuccess,
                  serverStatus.status === 'error' && styles.serverStatusError,
                ]}
              >
                {serverStatus.status === 'success'
                  ? '✅ Server reachable'
                  : serverStatus.status === 'error'
                    ? '⚠️ Server error'
                    : 'Server status unknown'}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={refreshServerModels}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>Refresh models</Text>
          </TouchableOpacity>
        </View>
        {serverStatus.message ? (
          <Text
            style={[
              styles.serverStatusMessage,
              serverStatus.status === 'error' && styles.serverStatusError,
            ]}
          >
            {serverStatus.message}
          </Text>
        ) : null}
      </SettingsItem>

      {serverModelOptions.length > 0 && (
        <SettingsItem title="Server Model">
          <Dropdown
            items={serverModelOptions}
            selectedValue={formData.serverModel}
            onValueChange={value => onServerModelChange(value)}
            placeholder="Select a server model"
          />
          <Text style={styles.helpText}>
            Choose the model the app will use when generating chat responses.
          </Text>
        </SettingsItem>
      )}

      <SettingsItem title="Username">
        <TextInput
          style={styles.textInput}
          value={formData.username}
          onChangeText={value => onUpdateFormData('username', value)}
          placeholder="Enter Username"
          autoCapitalize="none"
        />
      </SettingsItem>
    </>
  );
};

const createStyles = (currentTheme: any) => StyleSheet.create({
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
  helpText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
    marginTop: currentTheme.spacing.xs,
    fontStyle: 'italic',
  },
  serverStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: currentTheme.spacing.md,
  },
  serverStatusIndicator: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  serverStatusText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.textSecondary,
  },
  serverStatusSuccess: {
    color: currentTheme.colors.success,
  },
  serverStatusError: {
    color: currentTheme.colors.error,
  },
  serverStatusMessage: {
    marginTop: currentTheme.spacing.xs,
    fontSize: currentTheme.typography.fontSizes.xs,
    color: currentTheme.colors.textSecondary,
  },
  refreshButton: {
    paddingHorizontal: currentTheme.spacing.md,
    paddingVertical: currentTheme.spacing.xs,
    borderRadius: currentTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: currentTheme.colors.border,
    marginLeft: currentTheme.spacing.md,
    backgroundColor: currentTheme.colors.surface,
  },
  refreshButtonText: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: currentTheme.colors.primary,
    fontWeight: currentTheme.typography.fontWeights.semibold,
  },
});

export default BasicSettingsForm;
