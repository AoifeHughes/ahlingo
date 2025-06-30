import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';

type ConversationExercisesScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConversationExercises'
>;

type ConversationExercisesScreenRouteProp = RouteProp<RootStackParamList, 'ConversationExercises'>;

interface Props {
  navigation: ConversationExercisesScreenNavigationProp;
  route: ConversationExercisesScreenRouteProp;
}

const ConversationExercisesScreen: React.FC<Props> = ({ navigation, route }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>💬</Text>
      <Text style={styles.title}>Conversation Exercises</Text>
      <Text style={styles.subtext}>Coming Soon!</Text>
      <Text style={styles.description}>
        Practice real conversations with interactive dialogue exercises.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 32,
  },
  placeholder: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtext: {
    fontSize: 18,
    color: '#666',
    marginBottom: 16,
    fontWeight: '600',
  },
  description: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ConversationExercisesScreen;