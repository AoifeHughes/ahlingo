import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  Text,
} from 'react-native';
import {Button} from 'react-native-elements';
import {useNavigation} from '@react-navigation/native';
import {useTheme} from '../components/ThemeProvider';

export function ConversationExercisesScreen(): JSX.Element {
  const theme = useTheme();
  const navigation = useNavigation();

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.content}>
        <Text style={[styles.title, {color: theme.colors.text}]}>
          Conversation Exercises
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.textSecondary}]}>
          Coming Soon!
        </Text>
        <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
          This screen will feature interactive conversation exercises where you can:
        </Text>
        
        <View style={styles.featureList}>
          <Text style={[styles.feature, {color: theme.colors.textSecondary}]}>
            • Practice real conversations
          </Text>
          <Text style={[styles.feature, {color: theme.colors.textSecondary}]}>
            • Listen to native pronunciation
          </Text>
          <Text style={[styles.feature, {color: theme.colors.textSecondary}]}>
            • Record your responses
          </Text>
          <Text style={[styles.feature, {color: theme.colors.textSecondary}]}>
            • Get feedback on pronunciation
          </Text>
        </View>

        <Button
          title="Back to Main Menu"
          onPress={() => navigation.goBack()}
          buttonStyle={[styles.backButton, {backgroundColor: theme.colors.primary}]}
          titleStyle={styles.buttonText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  featureList: {
    marginBottom: 32,
    alignSelf: 'stretch',
  },
  feature: {
    fontSize: 16,
    marginVertical: 4,
    lineHeight: 24,
  },
  backButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});