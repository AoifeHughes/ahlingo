import React, {useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Text,
  Image,
} from 'react-native';
import {Button} from 'react-native-elements';
import {useNavigation} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useDispatch, useSelector} from 'react-redux';
import {NavigationParams} from '@ahlingo/core';
import {useTheme} from '../components/ThemeProvider';
import {RootState} from '../store';
import {loadUserSettings, loadReferenceData} from '../store/slices/userSettingsSlice';
import {loadTopics} from '../store/slices/exerciseSlice';

type MainMenuNavigationProp = StackNavigationProp<NavigationParams, 'MainMenu'>;

export function MainMenuScreen(): JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation<MainMenuNavigationProp>();
  const dispatch = useDispatch();
  
  const {settings, isLoading} = useSelector((state: RootState) => state.userSettings);

  useEffect(() => {
    // Load initial data when the app starts
    dispatch(loadUserSettings());
    dispatch(loadReferenceData());
    dispatch(loadTopics());
  }, [dispatch]);

  const menuButtons = [
    {
      title: 'Pairs Game',
      icon: 'gamepad-variant',
      onPress: () => navigation.navigate('TopicSelection'),
      description: 'Match words and phrases',
    },
    {
      title: 'Conversation',
      icon: 'chat-bubble',
      onPress: () => navigation.navigate('TopicSelection'),
      description: 'Practice conversations',
    },
    {
      title: 'Translation',
      icon: 'translate',
      onPress: () => navigation.navigate('TopicSelection'),
      description: 'Translate text',
    },
    {
      title: 'AI Chatbot',
      icon: 'robot',
      onPress: () => navigation.navigate('Chatbot'),
      description: 'Chat with AI tutor',
    },
    {
      title: 'Settings',
      icon: 'settings',
      onPress: () => navigation.navigate('Settings'),
      description: 'Customize your experience',
    },
  ];

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* App Logo/Header */}
        <View style={styles.header}>
          <Text style={[styles.appTitle, {color: theme.colors.text}]}>
            AHLingo
          </Text>
          <Text style={[styles.appSubtitle, {color: theme.colors.textSecondary}]}>
            Language Learning App
          </Text>
          {settings && (
            <Text style={[styles.welcomeText, {color: theme.colors.textSecondary}]}>
              Learning {settings.language.language} • {settings.difficulty.difficulty_level}
            </Text>
          )}
        </View>

        {/* Menu Buttons */}
        <View style={styles.menuContainer}>
          {menuButtons.map((button, index) => (
            <View key={index} style={styles.buttonContainer}>
              <Button
                title={button.title}
                onPress={button.onPress}
                buttonStyle={[
                  styles.menuButton,
                  {backgroundColor: theme.colors.primary}
                ]}
                titleStyle={styles.buttonTitle}
                disabled={isLoading}
              />
              <Text style={[styles.buttonDescription, {color: theme.colors.textSecondary}]}>
                {button.description}
              </Text>
            </View>
          ))}
        </View>

        {/* Status Information */}
        {isLoading && (
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, {color: theme.colors.textSecondary}]}>
              Loading...
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginVertical: 32,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  appSubtitle: {
    fontSize: 16,
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  buttonContainer: {
    marginVertical: 8,
  },
  menuButton: {
    height: 56,
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  statusContainer: {
    alignItems: 'center',
    marginTop: 16,
  },
  statusText: {
    fontSize: 14,
  },
});