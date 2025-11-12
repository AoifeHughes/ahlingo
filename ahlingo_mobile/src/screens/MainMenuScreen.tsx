import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type MainMenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainMenu'
>;

interface Props {
  navigation: MainMenuScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const cardSize = (width - 60) / 2; // 2 cards per row with padding

const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();

  // Define the first 5 theme colors to cycle through
  const themeColors = [
    theme.colors.primary,
    theme.colors.secondary,
    theme.colors.success,
    theme.colors.warning,
    theme.colors.info,
  ];

  const exerciseItems = [
    {
      title: 'Exercise Shuffle',
      screen: 'ExerciseShuffleStart' as keyof RootStackParamList,
      icon: '🎲',
      exerciseType: null,
    },
    {
      title: 'Match Words',
      screen: 'TopicSelection' as keyof RootStackParamList,
      icon: '🎯',
      exerciseType: 'pairs',
    },
    {
      title: 'Conversations',
      screen: 'TopicSelection' as keyof RootStackParamList,
      icon: '💬',
      exerciseType: 'conversation',
    },
    {
      title: 'Translate',
      screen: 'TopicSelection' as keyof RootStackParamList,
      icon: '📝',
      exerciseType: 'translation',
    },
    {
      title: 'Fill in the Blank',
      screen: 'TopicSelection' as keyof RootStackParamList,
      icon: '✏️',
      exerciseType: 'fill_in_blank',
    },
    {
      title: 'Study Topic',
      screen: 'StudyTopic' as keyof RootStackParamList,
      icon: '📚',
      exerciseType: null,
    },
    {
      title: 'Chat Practice',
      screen: 'Chatbot' as keyof RootStackParamList,
      icon: '🤖',
      exerciseType: null,
    },
    {
      title: 'Your Stats',
      screen: 'Stats' as keyof RootStackParamList,
      icon: '📊',
      exerciseType: null,
    },
    {
      title: 'Retry Mistakes',
      screen: 'RetryMistakes' as keyof RootStackParamList,
      icon: '🔄',
      exerciseType: null,
    },
    {
      title: 'About',
      screen: 'About' as keyof RootStackParamList,
      icon: 'ℹ️',
      exerciseType: null,
    },
  ].map((item, index) => ({
    ...item,
    color: themeColors[index % themeColors.length],
  }));

  const handleExercisePress = async (item: (typeof exerciseItems)[0]) => {
    if (item.exerciseType) {
      navigation.navigate('TopicSelection', {
        exerciseType: item.exerciseType as
          | 'pairs'
          | 'conversation'
          | 'translation'
          | 'fill_in_blank',
      });
    } else if (item.title === 'Exercise Shuffle') {
      // Navigate directly to shuffle start screen
      navigation.navigate('ExerciseShuffleStart', { exercises: [] });
    } else if (item.title === 'Chat Practice') {
      // Quick validation before navigating to Chat Practice
      try {
        const { getUserSettings } = await import('../services/RefactoredDatabaseService');
        const userSettings = await getUserSettings('default_user'); // Use default for quick check

        const hasServerUrl = userSettings.server_url && userSettings.server_url.trim() !== '';
        const hasLocalEnabled = userSettings.enable_local_models === 'true';

        if (!hasServerUrl && !hasLocalEnabled) {
          Alert.alert(
            'AI Server Setup Required',
            'Chat Practice requires an AI server or local models to be configured.\n\nWould you like to set this up now?',
            [
              {
                text: 'Setup Now',
                onPress: () => {
                  // Navigation will happen after alert is dismissed
                  navigation.navigate('Settings');
                }
              },
              { text: 'Maybe Later', style: 'cancel' }
            ]
          );
          return; // Prevent navigation to chatbot
        }

        // Only navigate to chatbot if configuration is valid
        navigation.navigate(item.screen as any);
      } catch (error) {
        console.error('Failed to check AI configuration:', error);
        // Continue to chat screen for detailed error handling
        navigation.navigate(item.screen as any);
      }
    } else {
      navigation.navigate(item.screen as any);
    }
  };

  const styles = createStyles(theme);

  return (
    <>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title} testID="app-title">AHLingo</Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
            testID="settings-button"
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* All exercise cards (2 column grid) */}
          <View style={styles.exercisesGrid}>
            {exerciseItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.exerciseCard, { backgroundColor: item.color }]}
                onPress={() => handleExercisePress(item)}
                activeOpacity={0.8}
                testID={`exercise-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Start your language learning journey
          </Text>
        </View>
      </View>
    </>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  header: {
    backgroundColor: currentTheme.colors.primary,
    paddingTop: 60,
    paddingBottom: currentTheme.spacing['3xl'],
    paddingHorizontal: currentTheme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...currentTheme.shadows.lg,
  },
  title: {
    fontSize: currentTheme.typography.fontSizes['4xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.background,
    textAlign: 'center',
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    right: currentTheme.spacing.xl,
    top: 60,
    width: currentTheme.spacing['5xl'],
    height: currentTheme.spacing['5xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: currentTheme.spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsIcon: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    color: currentTheme.colors.background,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: currentTheme.spacing.xl,
    paddingVertical: currentTheme.spacing.xl,
    paddingBottom: currentTheme.spacing['2xl'],
  },
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exerciseCard: {
    width: cardSize,
    height: cardSize,
    borderRadius: currentTheme.spacing.xl,
    marginBottom: currentTheme.spacing.lg,
    ...currentTheme.shadows.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 72,
    marginBottom: currentTheme.spacing.lg,
  },
  cardTitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.background,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    paddingHorizontal: currentTheme.spacing.sm,
  },
  footer: {
    paddingVertical: currentTheme.spacing.xl,
    paddingHorizontal: currentTheme.spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default MainMenuScreen;
