import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import {
  getLanguages,
  getDifficulties,
  setUserSetting,
  getUserId,
} from '../services/RefactoredDatabaseService';
import { setSettings } from '../store/slices/settingsSlice';
import { useDispatch } from 'react-redux';
import { Language, Difficulty } from '../types';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Welcome'
>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [difficulties, setDifficulties] = useState<Difficulty[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');

  // Language to flag emoji mapping
  const languageFlags: { [key: string]: string } = {
    'French': '🇫🇷',
    'German': '🇩🇪',
    'Italian': '🇮🇹',
    'Spanish': '🇪🇸',
    'Ukrainian': '🇺🇦',
  };

  // Difficulty descriptions
  const difficultyDescriptions: { [key: string]: string } = {
    'Beginner': 'Perfect for starting your language journey',
    'Intermediate': 'Great for building on your existing knowledge',
    'Advanced': 'Challenge yourself with complex exercises',
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load languages from database
      const languagesData = await getLanguages();
      setLanguages(languagesData);

      // Load difficulties from database
      const difficultiesData = await getDifficulties();
      setDifficulties(difficultiesData);

      // Set default selections to first available options
      if (languagesData.length > 0) {
        setSelectedLanguage(languagesData[0].language);
      }
      if (difficultiesData.length > 0) {
        setSelectedDifficulty(difficultiesData[0].difficulty_level);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      Alert.alert('Error', 'Failed to load language options. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGetStarted = async () => {
    if (!selectedLanguage || !selectedDifficulty) {
      Alert.alert('Selection Required', 'Please select both a language and difficulty level.');
      return;
    }

    try {
      setSaving(true);

      // Create new user with default username
      const username = 'default_user';
      const userId = await getUserId(username);

      if (!userId) {
        throw new Error('Failed to create user');
      }

      // Save selections to database
      await setUserSetting(username, 'language', selectedLanguage);
      await setUserSetting(username, 'difficulty', selectedDifficulty);
      await setUserSetting(username, 'has_completed_welcome', 'true');

      // Update Redux store
      dispatch(setSettings({
        language: selectedLanguage,
        difficulty: selectedDifficulty,
        userId: userId,
      }));

      // Navigate to main app
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainMenu' }],
      });
    } catch (error) {
      console.error('Failed to create user and save settings:', error);
      Alert.alert('Error', 'Failed to set up your account. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to AHLingo! 🎉</Text>
        <Text style={styles.subtitle}>
          Let's get you started with your language learning journey
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What language would you like to learn?</Text>
        <View style={styles.optionGrid}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.language}
              style={[
                styles.optionButton,
                selectedLanguage === language.language && styles.selectedOption,
              ]}
              onPress={() => setSelectedLanguage(language.language)}
            >
              <Text style={styles.flagEmoji}>
                {languageFlags[language.language] || '🌐'}
              </Text>
              <Text style={[
                styles.optionText,
                selectedLanguage === language.language && styles.selectedOptionText,
              ]}>
                {language.language}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What's your experience level?</Text>
        <View style={styles.difficultyContainer}>
          {difficulties.map((difficulty) => (
            <TouchableOpacity
              key={difficulty.difficulty_level}
              style={[
                styles.difficultyButton,
                selectedDifficulty === difficulty.difficulty_level && styles.selectedDifficulty,
              ]}
              onPress={() => setSelectedDifficulty(difficulty.difficulty_level)}
            >
              <Text style={[
                styles.difficultyTitle,
                selectedDifficulty === difficulty.difficulty_level && styles.selectedDifficultyText,
              ]}>
                {difficulty.difficulty_level}
              </Text>
              <Text style={[
                styles.difficultyDescription,
                selectedDifficulty === difficulty.difficulty_level && styles.selectedDifficultyText,
              ]}>
                {difficultyDescriptions[difficulty.difficulty_level] || 'Learn at your own pace'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Don't worry, you can change these settings anytime in the menu
        </Text>
        
        <TouchableOpacity
          style={[styles.getStartedButton, saving && styles.disabledButton]}
          onPress={handleGetStarted}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={theme.colors.surface} />
          ) : (
            <Text style={styles.getStartedButtonText}>Get Started</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  content: {
    padding: currentTheme.spacing.xl,
    paddingTop: currentTheme.spacing['3xl'],
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
  header: {
    alignItems: 'center',
    marginBottom: currentTheme.spacing['3xl'],
  },
  title: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.lg,
  },
  subtitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    marginBottom: currentTheme.spacing['3xl'],
  },
  sectionTitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.lg,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '48%',
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.lg,
    padding: currentTheme.spacing.lg,
    alignItems: 'center',
    marginBottom: currentTheme.spacing.base,
    borderWidth: 2,
    borderColor: currentTheme.colors.border,
    ...currentTheme.shadows.base,
  },
  selectedOption: {
    borderColor: currentTheme.colors.primary,
    backgroundColor: currentTheme.colors.primary + '10',
  },
  flagEmoji: {
    fontSize: 32,
    marginBottom: currentTheme.spacing.base,
  },
  optionText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.medium,
    color: currentTheme.colors.text,
  },
  selectedOptionText: {
    color: currentTheme.colors.primary,
  },
  difficultyContainer: {
    gap: currentTheme.spacing.base,
  },
  difficultyButton: {
    backgroundColor: currentTheme.colors.surface,
    borderRadius: currentTheme.borderRadius.lg,
    padding: currentTheme.spacing.lg,
    borderWidth: 2,
    borderColor: currentTheme.colors.border,
    ...currentTheme.shadows.base,
  },
  selectedDifficulty: {
    borderColor: currentTheme.colors.primary,
    backgroundColor: currentTheme.colors.primary + '10',
  },
  difficultyTitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.xs,
  },
  difficultyDescription: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    lineHeight: 20,
  },
  selectedDifficultyText: {
    color: currentTheme.colors.primary,
  },
  footer: {
    alignItems: 'center',
    marginTop: currentTheme.spacing.xl,
  },
  footerText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.xl,
    lineHeight: 20,
  },
  getStartedButton: {
    backgroundColor: currentTheme.colors.primary,
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing['3xl'],
    borderRadius: currentTheme.borderRadius.lg,
    minWidth: 200,
    alignItems: 'center',
    ...currentTheme.shadows.base,
  },
  disabledButton: {
    opacity: 0.6,
  },
  getStartedButtonText: {
    color: currentTheme.colors.surface,
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.bold,
  },
});

export default WelcomeScreen;