import React from 'react';
import {createStackNavigator} from '@react-navigation/stack';
import {ScreenName, NavigationParams} from '@ahlingo/core';

// Import screens
import {MainMenuScreen} from '../screens/MainMenuScreen';
import {SettingsScreen} from '../screens/SettingsScreen';
import {TopicSelectionScreen} from '../screens/TopicSelectionScreen';
import {PairsGameScreen} from '../screens/PairsGameScreen';
import {ConversationExercisesScreen} from '../screens/ConversationExercisesScreen';
import {TranslationExercisesScreen} from '../screens/TranslationExercisesScreen';
import {ChatbotScreen} from '../screens/ChatbotScreen';

const Stack = createStackNavigator<NavigationParams>();

export function AppNavigator(): JSX.Element {
  return (
    <Stack.Navigator
      initialRouteName="MainMenu"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1976D2',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerBackTitleVisible: false,
      }}>
      <Stack.Screen
        name="MainMenu"
        component={MainMenuScreen}
        options={{
          title: 'AHLingo',
          headerLeft: () => null, // Remove back button on main menu
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="TopicSelection"
        component={TopicSelectionScreen}
        options={{
          title: 'Choose Topic',
        }}
      />
      <Stack.Screen
        name="PairsGame"
        component={PairsGameScreen}
        options={{
          title: 'Pairs Game',
        }}
      />
      <Stack.Screen
        name="ConversationExercises"
        component={ConversationExercisesScreen}
        options={{
          title: 'Conversation',
        }}
      />
      <Stack.Screen
        name="TranslationExercises"
        component={TranslationExercisesScreen}
        options={{
          title: 'Translation',
        }}
      />
      <Stack.Screen
        name="Chatbot"
        component={ChatbotScreen}
        options={{
          title: 'AI Chat',
        }}
      />
    </Stack.Navigator>
  );
}