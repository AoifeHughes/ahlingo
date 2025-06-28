import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { NavigationParams } from '@ahlingo/core';

type NavigationProp = NativeStackNavigationProp<NavigationParams>;

export const MainMenuScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const menuItems = [
    {
      title: 'Pairs Game',
      subtitle: 'Match words and phrases',
      onPress: () => navigation.navigate('TopicSelection'),
      color: '#4CAF50',
    },
    {
      title: 'Conversation',
      subtitle: 'Practice conversations',
      onPress: () => navigation.navigate('TopicSelection'),
      color: '#2196F3',
    },
    {
      title: 'Translation',
      subtitle: 'Translate sentences',
      onPress: () => navigation.navigate('TopicSelection'),
      color: '#FF9800',
    },
    {
      title: 'AI Chatbot',
      subtitle: 'Chat with AI tutor',
      onPress: () => navigation.navigate('Chatbot'),
      color: '#9C27B0',
    },
    {
      title: 'Settings',
      subtitle: 'Customize your experience',
      onPress: () => navigation.navigate('Settings'),
      color: '#607D8B',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#2196F3" barStyle="light-content" />
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to AHLingo</Text>
        <Text style={styles.subtitle}>Choose an activity to start learning</Text>
        
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: item.color }]}
              onPress={item.onPress}
              activeOpacity={0.8}
            >
              <Text style={styles.menuItemTitle}>{item.title}</Text>
              <Text style={styles.menuItemSubtitle}>{item.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  menuContainer: {
    flex: 1,
  },
  menuItem: {
    padding: 20,
    marginBottom: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
});