import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type ChatbotScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Chatbot'
>;

interface Props {
  navigation: ChatbotScreenNavigationProp;
}

const ChatbotScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Chatbot Screen</Text>
      <Text style={styles.subtext}>To be implemented</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholder: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
  },
  subtext: {
    fontSize: 16,
    color: '#666',
  },
});

export default ChatbotScreen;