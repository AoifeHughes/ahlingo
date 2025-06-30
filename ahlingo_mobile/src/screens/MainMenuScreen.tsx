import React from 'react';
import { View, StyleSheet, Text, StatusBar, TouchableOpacity, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type MainMenuScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'MainMenu'
>;

interface Props {
  navigation: MainMenuScreenNavigationProp;
}

const { width } = Dimensions.get('window');
const cardSize = (width - 60) / 2; // 2 cards per row with padding

const MainMenuScreen: React.FC<Props> = ({ navigation }) => {
  const exerciseItems = [
    { 
      title: 'Match Words', 
      screen: 'TopicSelection' as keyof RootStackParamList,
      icon: '🎯',
      exerciseType: 'pairs',
      color: '#FF6B6B'
    },
    { 
      title: 'Conversations', 
      screen: 'TopicSelection' as keyof RootStackParamList,
      icon: '💬',
      exerciseType: 'conversation',
      color: '#4ECDC4'
    },
    { 
      title: 'Translate', 
      screen: 'TopicSelection' as keyof RootStackParamList,
      icon: '📝',
      exerciseType: 'translation',
      color: '#45B7D1'
    },
    { 
      title: 'Chat Practice', 
      screen: 'Chatbot' as keyof RootStackParamList,
      icon: '🤖',
      exerciseType: null,
      color: '#96CEB4'
    },
    { 
      title: 'Your Stats', 
      screen: 'Stats' as keyof RootStackParamList,
      icon: '📊',
      exerciseType: null,
      color: '#9C27B0'
    },
    { 
      title: 'Retry Mistakes', 
      screen: 'RetryMistakes' as keyof RootStackParamList,
      icon: '🔄',
      exerciseType: null,
      color: '#FF9800'
    },
  ];

  const handleExercisePress = (item: typeof exerciseItems[0]) => {
    if (item.exerciseType) {
      navigation.navigate('TopicSelection', { exerciseType: item.exerciseType });
    } else {
      navigation.navigate(item.screen as any);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="#1976D2" barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>AHLingo</Text>
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.cardsContainer}>
          {/* All exercise cards (3x2 grid) */}
          <View style={styles.exercisesGrid}>
            {exerciseItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.exerciseCard, { backgroundColor: item.color }]}
                onPress={() => handleExercisePress(item)}
                activeOpacity={0.8}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.cardIcon}>{item.icon}</Text>
                  <Text style={styles.cardTitle}>{item.title}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Start your language learning journey</Text>
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
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 1,
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    top: 60,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingsIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  exercisesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  exerciseCard: {
    width: cardSize,
    height: cardSize,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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