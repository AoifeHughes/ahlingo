import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationParams } from '@ahlingo/core';

// Import screens - these will be created next
import { MainMenuScreen } from '../screens/MainMenuScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { TopicSelectionScreen } from '../screens/TopicSelectionScreen';
import { PairsGameScreen } from '../screens/PairsGameScreen';
import { ConversationExercisesScreen } from '../screens/ConversationExercisesScreen';
import { TranslationExercisesScreen } from '../screens/TranslationExercisesScreen';
import { ChatbotScreen } from '../screens/ChatbotScreen';

const Stack = createNativeStackNavigator<NavigationParams>();

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="MainMenu"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#2196F3',
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
          options={{
            title: 'AHLingo',
            headerLeft: () => null, // Disable back button on main menu
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
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
          options={{ title: 'AI Chatbot' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};