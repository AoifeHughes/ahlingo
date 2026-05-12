import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { checkUsersExist } from '../services/RefactoredDatabaseService';
import { ActivityIndicator, View } from 'react-native';
import HeaderIconButton from '../components/HeaderIconButton';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MainMenuBackButtonProps {
  navigation: NavigationProp;
}

const MainMenuBackButton: React.FC<MainMenuBackButtonProps> = ({ navigation }) => (
  <HeaderIconButton onPress={() => navigation.navigate('MainMenu')} icon="←" />
);

// Import screens (placeholder imports for now)
import WelcomeScreen from '../screens/WelcomeScreen';
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
import AboutScreen from '../screens/AboutScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const checkInitialRoute = async () => {
      try {
        const usersExist = await checkUsersExist();
        setShowWelcome(!usersExist);
      } catch (error) {
        console.error('Failed to check users exist:', error);
        setShowWelcome(true); // Default to showing welcome on error
      } finally {
        setIsLoading(false);
      }
    };

    checkInitialRoute();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={showWelcome ? "Welcome" : "MainMenu"}
        screenOptions={{
          headerStyle: {
            backgroundColor: theme.colors.primary,
          },
          headerTintColor: theme.colors.background,
          headerTitleStyle: {
            fontWeight: theme.typography.fontWeights.semibold,
            fontSize: theme.typography.fontSizes.lg,
          },
          headerBackButtonMenuEnabled: false,
        }}
      >
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="MainMenu"
          component={MainMenuScreen}
          options={{ headerShown: false, title: 'Main Menu' }}
        />
        <Stack.Screen
          name="TopicSelection"
          component={TopicSelectionScreen}
          options={({ navigation }) => ({
            title: 'Select Topic',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="PairsGame"
          component={PairsGameScreen}
          options={({ navigation }) => ({
            title: 'Pairs Game',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="ConversationExercises"
          component={ConversationExercisesScreen}
          options={({ navigation }) => ({
            title: 'Conversation',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="TranslationExercises"
          component={TranslationExercisesScreen}
          options={({ navigation }) => ({
            title: 'Translation',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Chatbot"
          component={ChatbotScreen}
          options={({ navigation }) => ({
            title: 'Chatbot',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={({ navigation }) => ({
            title: 'Settings',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="Stats"
          component={StatsScreen}
          options={({ navigation }) => ({
            title: 'Your Progress',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="RetryMistakes"
          component={RetryMistakesScreen}
          options={({ navigation }) => ({
            title: 'Retry Mistakes',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="StudyTopic"
          component={StudyTopicScreen}
          options={({ navigation }) => ({
            title: 'Study Topic',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="StudyTopicShuffle"
          component={StudyTopicShuffleScreen}
          options={({ navigation }) => ({
            title: 'Study Session',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="FillInTheBlank"
          component={FillInTheBlankScreen}
          options={({ navigation }) => ({
            title: 'Fill in the Blank',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="ExerciseShuffleStart"
          component={ExerciseShuffleStartScreen}
          options={({ navigation }) => ({
            title: 'Exercise Shuffle',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="ExerciseShuffleTransition"
          component={ExerciseShuffleTransitionScreen}
          options={({ navigation }) => ({
            title: 'Challenge Progress',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="ExerciseShuffleSummary"
          component={ExerciseShuffleSummaryScreen}
          options={({ navigation }) => ({
            title: 'Shuffle Results',
            headerLeft: () => <MainMenuBackButton navigation={navigation} />,
          })}
        />
        <Stack.Screen
          name="About"
          component={AboutScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
