import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  BackHandler,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootStackParamList, ExerciseShuffleContext, ShuffleExercise } from '../types';
import { RootState } from '../store';
import { useTheme } from '../contexts/ThemeContext';
import {
  getRandomMixedExercises,
  getUserSettings,
  getMostRecentUser,
  getUserId,
} from '../services/SimpleDatabaseService';

type ExerciseShuffleStartScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ExerciseShuffleStart'
>;

type ExerciseShuffleStartScreenRouteProp = RouteProp<
  RootStackParamList,
  'ExerciseShuffleStart'
>;

interface Props {
  navigation: ExerciseShuffleStartScreenNavigationProp;
  route: ExerciseShuffleStartScreenRouteProp;
}

const ExerciseShuffleStartScreen: React.FC<Props> = ({ navigation, route }) => {
  const { exercises: initialExercises } = route.params;
  const { settings } = useSelector((state: RootState) => state.settings);
  const { theme } = useTheme();
  const [exercises, setExercises] = useState<ShuffleExercise[]>(initialExercises);
  const [loading, setLoading] = useState(initialExercises.length === 0);

  useEffect(() => {
    if (initialExercises.length === 0) {
      loadShuffleExercises();
    }
  }, []);

  // Handle back button press
  const handleBackPress = useCallback(() => {
    Alert.alert(
      'Exit Shuffle?',
      'Your progress will be lost if you exit now.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Exit', 
          style: 'destructive',
          onPress: () => navigation.navigate('MainMenu')
        },
      ]
    );
    return true; // Prevent default back action
  }, [navigation]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => handleBackPress();
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackPress])
  );

  const loadShuffleExercises = async () => {
    try {
      setLoading(true);

      // Get user settings
      const username = await getMostRecentUser();
      const userSettings = await getUserSettings(username);
      const language = userSettings.language || settings.language || 'French';
      const difficulty = userSettings.difficulty || settings.difficulty || 'Beginner';

      // Get user ID for prioritizing untried exercises
      const userId = await getUserId(username);

      // Get 5 random mixed exercises
      const loadedExercises = await getRandomMixedExercises(userId, language, difficulty);

      if (loadedExercises.length === 0) {
        Alert.alert(
          'No Exercises Found',
          'No exercises are available for your current language and difficulty settings. Please check your settings or try again later.',
          [{ text: 'OK', onPress: () => navigation.navigate('MainMenu') }]
        );
        return;
      }

      if (loadedExercises.length < 5) {
        Alert.alert(
          'Limited Exercises',
          `Only ${loadedExercises.length} exercises are available. The shuffle will continue with these exercises.`,
          [
            { text: 'Cancel', onPress: () => navigation.navigate('MainMenu') },
            { 
              text: 'Continue', 
              onPress: () => setExercises(loadedExercises)
            },
          ]
        );
      } else {
        setExercises(loadedExercises);
      }
    } catch (error) {
      console.error('Failed to load shuffle exercises:', error);
      Alert.alert(
        'Error',
        'Failed to load exercises for shuffle. Please try again.',
        [{ text: 'OK', onPress: () => navigation.navigate('MainMenu') }]
      );
    } finally {
      setLoading(false);
    }
  };

  const startShuffle = () => {
    const firstExercise = exercises[0];
    
    const shuffleContext: ExerciseShuffleContext = {
      isShuffleMode: true,
      currentChallenge: 1,
      totalChallenges: exercises.length,
      onComplete: (success: boolean) => {
        // Navigate to transition screen with result tracking
        if (exercises.length > 1) {
          navigation.navigate('ExerciseShuffleTransition', {
            currentChallenge: 1,
            totalChallenges: exercises.length,
            success,
            nextExercise: exercises[1],
            results: [success],
            exercises,
          });
        } else {
          // Only one exercise, go to summary
          navigation.navigate('ExerciseShuffleSummary', {
            results: [success],
            exercises,
          });
        }
      },
    };

    // Navigate to the appropriate exercise screen
    switch (firstExercise.exerciseType) {
      case 'pairs':
        navigation.navigate('PairsGame', {
          shuffleContext,
          exerciseInfo: firstExercise.exerciseInfo,
        });
        break;
      case 'conversation':
        navigation.navigate('ConversationExercises', {
          shuffleContext,
          exerciseInfo: firstExercise.exerciseInfo,
        });
        break;
      case 'translation':
        navigation.navigate('TranslationExercises', {
          shuffleContext,
          exerciseInfo: firstExercise.exerciseInfo,
        });
        break;
    }
  };

  const styles = createStyles(theme);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>🎲</Text>
          <Text style={styles.title}>Exercise Shuffle</Text>
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loader} />
          <Text style={styles.loadingText}>Preparing your shuffle...</Text>
        </View>
      </View>
    );
  }

  if (exercises.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.icon}>❌</Text>
          <Text style={styles.title}>No Exercises Available</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('MainMenu')}
            activeOpacity={0.8}
          >
            <Text style={styles.backButtonText}>Back to Main Menu</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>🎲</Text>
        <Text style={styles.title}>Exercise Shuffle</Text>
        <Text style={styles.subtitle}>Ready to get started?</Text>
        
        <View style={styles.challengeIndicator}>
          <Text style={styles.challengeText}>Challenge 1/{exercises.length}</Text>
        </View>
        
        <View style={styles.exercisePreview}>
          <Text style={styles.previewTitle}>Your challenges include:</Text>
          {exercises.map((exercise, index) => (
            <Text key={index} style={styles.exerciseItem}>
              {index + 1}. {exercise.topicName} ({exercise.exerciseType})
            </Text>
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={startShuffle}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Challenge</Text>
        </TouchableOpacity>
        
      </View>
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: currentTheme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 350,
    width: '100%',
  },
  icon: {
    fontSize: 80,
    marginBottom: currentTheme.spacing.xl,
  },
  title: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  subtitle: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.primary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.xl,
  },
  challengeIndicator: {
    backgroundColor: currentTheme.colors.primary,
    paddingVertical: currentTheme.spacing.base,
    paddingHorizontal: currentTheme.spacing.lg,
    borderRadius: currentTheme.borderRadius.lg,
    marginBottom: currentTheme.spacing.xl,
  },
  challengeText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.background,
  },
  exercisePreview: {
    backgroundColor: currentTheme.colors.surface,
    padding: currentTheme.spacing.lg,
    borderRadius: currentTheme.borderRadius.lg,
    marginBottom: currentTheme.spacing.xl,
    width: '100%',
  },
  previewTitle: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.base,
    textAlign: 'center',
  },
  exerciseItem: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.xs,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: currentTheme.colors.success,
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing['2xl'],
    borderRadius: currentTheme.borderRadius.lg,
    marginBottom: currentTheme.spacing.lg,
    width: '100%',
    ...currentTheme.shadows.base,
  },
  startButtonText: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.background,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing.lg,
  },
  backButtonText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
  loader: {
    marginVertical: currentTheme.spacing.xl,
  },
  loadingText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default ExerciseShuffleStartScreen;