import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

// Import screens (placeholder imports for now)
import MainMenuScreen from '../screens/MainMenuScreen';
import TopicSelectionScreen from '../screens/TopicSelectionScreen';
import PairsGameScreen from '../screens/PairsGameScreen';
import ConversationExercisesScreen from '../screens/ConversationExercisesScreen';
import TranslationExercisesScreen from '../screens/TranslationExercisesScreen';
import ChatbotScreen from '../screens/ChatbotScreen';
import SettingsScreen from '../screens/SettingsScreen';
import StatsScreen from '../screens/StatsScreen';
import RetryMistakesScreen from '../screens/RetryMistakesScreen';
import StudyTopicScreen from '../screens/StudyTopicScreen';
import StudyTopicShuffleScreen from '../screens/StudyTopicShuffleScreen';
import FillInTheBlankScreen from '../screens/FillInTheBlankScreen';
import ExerciseShuffleStartScreen from '../screens/ExerciseShuffleStartScreen';
import ExerciseShuffleTransitionScreen from '../screens/ExerciseShuffleTransitionScreen';
import ExerciseShuffleSummaryScreen from '../screens/ExerciseShuffleSummaryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainMenu"
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.background,
          headerTitleStyle: {
            fontWeight: theme.typography.fontWeights.semibold,
            fontSize: theme.typography.fontSizes.lg,
          },
          headerBackTitle: 'Main Menu',
        }}
      >
        <Stack.Screen
          name="MainMenu"
          component={MainMenuScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TopicSelection"
          component={TopicSelectionScreen}
          options={{ title: 'Select Topic' }}
        />
        <Stack.Screen
          name="PairsGame"
          component={PairsGameScreen}
          options={({ route }) => ({
            title: 'Pairs Game',
            headerBackButtonMenuEnabled: !route.params?.shuffleContext,
          })}
        />
        <Stack.Screen
          name="ConversationExercises"
          component={ConversationExercisesScreen}
          options={({ route }) => ({
            title: 'Conversation',
            headerBackButtonMenuEnabled: !route.params?.shuffleContext,
          })}
        />
        <Stack.Screen
          name="TranslationExercises"
          component={TranslationExercisesScreen}
          options={({ route }) => ({
            title: 'Translation',
            headerBackButtonMenuEnabled: !route.params?.shuffleContext,
          })}
        />
        <Stack.Screen
          name="Chatbot"
          component={ChatbotScreen}
          options={{ title: 'Chatbot' }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={{ title: 'Your Progress' }}
        />
        <Stack.Screen
          name="RetryMistakes"
          component={RetryMistakesScreen}
          options={{ title: 'Retry Mistakes' }}
        />
        <Stack.Screen
          name="StudyTopic"
          component={StudyTopicScreen}
          options={{ title: 'Study Topic' }}
        />
        <Stack.Screen
          name="StudyTopicShuffle"
          component={StudyTopicShuffleScreen}
          options={{ title: 'Study Session' }}
        />
        <Stack.Screen
          name="FillInTheBlank"
          component={FillInTheBlankScreen}
          options={{ title: 'Fill in the Blank' }}
        />
        <Stack.Screen
          name="ExerciseShuffleStart"
          component={ExerciseShuffleStartScreen}
          options={{ title: 'Exercise Shuffle' }}
        />
        <Stack.Screen
          name="ExerciseShuffleTransition"
          component={ExerciseShuffleTransitionScreen}
          options={{ 
            title: 'Challenge Progress',
            headerBackButtonMenuEnabled: false,
          }}
        />
        <Stack.Screen
          name="ExerciseShuffleSummary"
          component={ExerciseShuffleSummaryScreen}
          options={{ title: 'Shuffle Results' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
