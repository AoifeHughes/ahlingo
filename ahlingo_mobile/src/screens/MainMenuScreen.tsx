import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Button } from 'react-native-elements';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useLanguages, useTopics, useDifficulties } from '../services/useDatabaseService';

type MainMenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainMenu'
>;

interface Props {
  navigation: MainMenuScreenNavigationProp;
}

const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const { languages } = useLanguages();
  const { topics } = useTopics();
  const { difficulties } = useDifficulties();

  const menuItems = [
    { title: 'Pairs', screen: 'TopicSelection' as keyof RootStackParamList },
    { title: 'Conversation', screen: 'ConversationExercises' as keyof RootStackParamList },
    { title: 'Translation', screen: 'TranslationExercises' as keyof RootStackParamList },
    { title: 'Chatbot', screen: 'Chatbot' as keyof RootStackParamList },
    { title: 'Settings', screen: 'Settings' as keyof RootStackParamList },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>AHLingo</Text>
        <Text style={styles.subtitle}>French Language Learning</Text>
        {/* Display database stats for testing */}
        <Text style={styles.dbStats}>
          {languages.length} languages, {topics.length} topics, {difficulties.length} difficulties
        </Text>
      </View>
      
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <Button
            key={index}
            title={item.title}
            buttonStyle={styles.menuButton}
            titleStyle={styles.menuButtonText}
            onPress={() => {
              if (item.screen === 'TopicSelection') {
                navigation.navigate('TopicSelection');
              } else {
                // For other screens, pass a default topicId for now
                navigation.navigate(item.screen as any, 
                  item.screen === 'ConversationExercises' || item.screen === 'TranslationExercises' 
                    ? { topicId: 1 } 
                    : undefined
                );
              }
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  dbStats: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontStyle: 'italic',
  },
  menuContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    backgroundColor: '#2196F3',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginVertical: 12,
    minWidth: 200,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MainMenuScreen;