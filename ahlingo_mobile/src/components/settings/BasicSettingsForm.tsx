import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Button } from 'react-native-elements';
import SettingsItem from '../SettingsItem';
import Dropdown, { DropdownItem } from '../Dropdown';
import { FormData } from '../../hooks/useSettingsForm';

interface BasicSettingsFormProps {
  formData: FormData;
  languages: DropdownItem[];
  difficulties: DropdownItem[];
  themes: DropdownItem[];
  onUpdateFormData: (field: keyof FormData, value: string | boolean) => void;
  theme: any;
}

const BasicSettingsForm: React.FC<BasicSettingsFormProps> = ({
  formData,
  languages,
  difficulties,
  themes,
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
      </SettingsItem>

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
});

export default BasicSettingsForm;