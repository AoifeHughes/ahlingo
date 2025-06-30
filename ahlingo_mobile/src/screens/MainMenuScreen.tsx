import React from 'react';
import { View, StyleSheet, Text, StatusBar } from 'react-native';
import { Button } from 'react-native-elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type MainMenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainMenu'
>;

interface Props {
  navigation: MainMenuScreenNavigationProp;
}

const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const menuItems = [
    { 
      title: 'Pairs Exercises', 
      screen: 'TopicSelection' as keyof RootStackParamList,
      icon: '🎯'
    },
    { 
      title: 'Conversation Exercises', 
      screen: 'ConversationExercises' as keyof RootStackParamList,
      icon: '💬'
    },
    { 
      title: 'Translation Exercises', 
      screen: 'TranslationExercises' as keyof RootStackParamList,
      icon: '📝'
    },
    { 
      title: 'Chatbot', 
      screen: 'Chatbot' as keyof RootStackParamList,
      icon: '🤖'
    },
    { 
      title: 'Settings', 
      screen: 'Settings' as keyof RootStackParamList,
      icon: '⚙️'
    },
  ];

  return (
    <>
      <StatusBar backgroundColor="#1976D2" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AHLingo</Text>
          <Text style={styles.subtitle}>Language Learning App</Text>
        </View>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Button
              key={index}
              title={`${item.icon}  ${item.title}`}
              buttonStyle={[
                styles.menuButton,
                { backgroundColor: index % 2 === 0 ? '#1976D2' : '#2196F3' }
              ]}
              titleStyle={styles.menuButtonText}
              onPress={() => {
                if (item.screen === 'TopicSelection') {
                  navigation.navigate('TopicSelection', { exerciseType: 'pairs' });
                } else if (item.screen === 'ConversationExercises') {
                  navigation.navigate('TopicSelection', { exerciseType: 'conversation' });
                } else if (item.screen === 'TranslationExercises') {
                  navigation.navigate('TopicSelection', { exerciseType: 'translation' });
                } else {
                  navigation.navigate(item.screen as any);
                }
              }}
            />
          ))}
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Start your French learning journey</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1976D2',
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#E3F2FD',
    textAlign: 'center',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  menuButton: {
    borderRadius: 12,
    paddingVertical: 18,
    paddingHorizontal: 40,
    marginVertical: 10,
    minWidth: 280,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

export default MainMenuScreen;