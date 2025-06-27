import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  Alert,
} from 'react-native';
import {Button, Input} from 'react-native-elements';
import {Picker} from '@react-native-picker/picker';
import {useDispatch, useSelector} from 'react-redux';
import {useTheme} from '../components/ThemeProvider';
import {RootState} from '../store';
import {saveUserSettings, updateSettings} from '../store/slices/userSettingsSlice';
import {Language, Difficulty} from '@ahlingo/core';

export function SettingsScreen(): JSX.Element {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  const {
    settings,
    availableLanguages,
    availableDifficulties,
    isLoading,
    error
  } = useSelector((state: RootState) => state.userSettings);

  // Local state for form inputs
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(
    settings?.language || null
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | null>(
    settings?.difficulty || null
  );
  const [apiEndpoint, setApiEndpoint] = useState(
    settings?.apiConfig?.endpoint || ''
  );
  const [apiKey, setApiKey] = useState(
    settings?.apiConfig?.apiKey || ''
  );

  const handleSave = () => {
    if (!selectedLanguage || !selectedDifficulty) {
      Alert.alert('Error', 'Please select both language and difficulty level.');
      return;
    }

    const updatedSettings = {
      language: selectedLanguage,
      difficulty: selectedDifficulty,
      apiConfig: {
        endpoint: apiEndpoint || undefined,
        apiKey: apiKey || undefined,
      },
    };

    dispatch(saveUserSettings(updatedSettings));
    
    Alert.alert('Success', 'Settings saved successfully!');
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Settings',
      'Are you sure you want to reset all settings to default?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            // Reset to first available options
            const defaultLanguage = availableLanguages[0] || null;
            const defaultDifficulty = availableDifficulties[0] || null;
            
            setSelectedLanguage(defaultLanguage);
            setSelectedDifficulty(defaultDifficulty);
            setApiEndpoint('');
            setApiKey('');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Language Selection */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Language
          </Text>
          <View style={[styles.pickerContainer, {borderColor: theme.colors.border}]}>
            <Picker
              selectedValue={selectedLanguage?.id || ''}
              onValueChange={(itemValue) => {
                const language = availableLanguages.find(lang => lang.id === itemValue);
                setSelectedLanguage(language || null);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Language..." value="" />
              {availableLanguages.map((language) => (
                <Picker.Item
                  key={language.id}
                  label={language.language}
                  value={language.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Difficulty Selection */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            Difficulty Level
          </Text>
          <View style={[styles.pickerContainer, {borderColor: theme.colors.border}]}>
            <Picker
              selectedValue={selectedDifficulty?.id || ''}
              onValueChange={(itemValue) => {
                const difficulty = availableDifficulties.find(diff => diff.id === itemValue);
                setSelectedDifficulty(difficulty || null);
              }}
              style={styles.picker}
            >
              <Picker.Item label="Select Difficulty..." value="" />
              {availableDifficulties.map((difficulty) => (
                <Picker.Item
                  key={difficulty.id}
                  label={difficulty.difficulty_level}
                  value={difficulty.id}
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* API Configuration */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
            API Configuration (Optional)
          </Text>
          
          <Input
            label="API Endpoint"
            placeholder="https://api.example.com"
            value={apiEndpoint}
            onChangeText={setApiEndpoint}
            containerStyle={styles.inputContainer}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Input
            label="API Key"
            placeholder="Enter your API key"
            value={apiKey}
            onChangeText={setApiKey}
            containerStyle={styles.inputContainer}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Current Settings Display */}
        {settings && (
          <View style={styles.sectionContainer}>
            <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
              Current Settings
            </Text>
            <Text style={[styles.currentSetting, {color: theme.colors.textSecondary}]}>
              Language: {settings.language.language}
            </Text>
            <Text style={[styles.currentSetting, {color: theme.colors.textSecondary}]}>
              Difficulty: {settings.difficulty.difficulty_level}
            </Text>
            <Text style={[styles.currentSetting, {color: theme.colors.textSecondary}]}>
              User ID: {settings.userId}
            </Text>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, {color: theme.colors.error}]}>
              {error}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Save Settings"
            onPress={handleSave}
            buttonStyle={[styles.saveButton, {backgroundColor: theme.colors.primary}]}
            titleStyle={styles.buttonTitle}
            loading={isLoading}
            disabled={isLoading}
          />
          
          <Button
            title="Reset to Default"
            onPress={handleReset}
            buttonStyle={[styles.resetButton, {backgroundColor: theme.colors.warning}]}
            titleStyle={styles.buttonTitle}
            disabled={isLoading}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 8,
  },
  picker: {
    height: 50,
  },
  inputContainer: {
    marginVertical: 8,
  },
  currentSetting: {
    fontSize: 14,
    marginVertical: 2,
  },
  errorContainer: {
    marginVertical: 16,
    padding: 12,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  buttonContainer: {
    marginTop: 24,
  },
  saveButton: {
    height: 50,
    borderRadius: 8,
    marginBottom: 12,
  },
  resetButton: {
    height: 50,
    borderRadius: 8,
  },
  buttonTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
});