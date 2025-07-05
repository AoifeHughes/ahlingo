import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
  BackHandler,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp, useFocusEffect } from '@react-navigation/native';
import { RootStackParamList, ExerciseShuffleContext, ShuffleExercise } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type StudyTopicShuffleScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StudyTopicShuffle'
>;

type StudyTopicShuffleScreenRouteProp = RouteProp<
  RootStackParamList,
  'StudyTopicShuffle'
>;

interface Props {
  navigation: StudyTopicShuffleScreenNavigationProp;
  route: StudyTopicShuffleScreenRouteProp;
}

const StudyTopicShuffleScreen: React.FC<Props> = ({ navigation, route }) => {
  const { topicId, topicName, exercises } = route.params;
  const { theme } = useTheme();

  // Handle back button press
  const handleBackPress = useCallback(() => {
    Alert.alert(
      'Exit Study Session?',
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

  const startStudySession = () => {
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
      case 'fill_in_blank':
        navigation.navigate('FillInTheBlank', {
          shuffleContext,
          exerciseInfo: firstExercise.exerciseInfo,
        });
        break;
    }
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📚</Text>
        <Text style={styles.title}>Study Topic</Text>
        <Text style={styles.topicName}>{topicName}</Text>
        <Text style={styles.subtitle}>Ready to dive deep?</Text>
        
        <View style={styles.challengeIndicator}>
          <Text style={styles.challengeText}>Challenge 1/{exercises.length}</Text>
        </View>
        
        <View style={styles.exercisePreview}>
          <Text style={styles.previewTitle}>Your study session includes:</Text>
          {exercises.map((exercise, index) => (
            <Text key={index} style={styles.exerciseItem}>
              {index + 1}. {exercise.exerciseType === 'fill_in_blank' ? 'Fill-in-the-blank' : 
                  exercise.exerciseType.charAt(0).toUpperCase() + exercise.exerciseType.slice(1)}
            </Text>
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.startButton}
          onPress={startStudySession}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Study Session</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Choose Different Topic</Text>
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
    marginBottom: currentTheme.spacing.lg,
  },
  title: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.xs,
  },
  topicName: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.primary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  subtitle: {
    fontSize: currentTheme.typography.fontSizes.xl,
    fontWeight: currentTheme.typography.fontWeights.medium,
    color: currentTheme.colors.textSecondary,
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
    marginBottom: currentTheme.spacing.base,
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
    paddingVertical: currentTheme.spacing.base,
    paddingHorizontal: currentTheme.spacing.lg,
  },
  backButtonText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
  },
});

export default StudyTopicShuffleScreen;