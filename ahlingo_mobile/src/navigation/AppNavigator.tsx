import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

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

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainMenu"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1976D2', // Material Design Blue 700
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
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
          options={{ title: 'Pairs Game' }}
        />
        <Stack.Screen
          name="ConversationExercises"
          component={ConversationExercisesScreen}
          options={{ title: 'Conversation' }}
        />
        <Stack.Screen
          name="TranslationExercises"
          component={TranslationExercisesScreen}
          options={{ title: 'Translation' }}
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
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;