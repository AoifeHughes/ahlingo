import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type ComingSoonScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'StudyTopic' | 'FillInTheBlank'
>;

type ComingSoonScreenRouteProp = RouteProp<
  RootStackParamList,
  'StudyTopic' | 'FillInTheBlank'
>;

interface Props {
  navigation: ComingSoonScreenNavigationProp;
  route: ComingSoonScreenRouteProp;
  featureName: string;
  featureIcon: string;
  description?: string;
}

const ComingSoonScreen: React.FC<Props> = ({
  navigation,
  featureName,
  featureIcon,
  description
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>{featureIcon}</Text>
        <Text style={styles.title}>{featureName}</Text>
        <Text style={styles.comingSoon}>Coming Soon!</Text>

        {description && (
          <Text style={styles.description}>{description}</Text>
        )}

        <Text style={styles.message}>
          We're working hard to bring you this exciting new feature.
          Stay tuned for updates!
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('MainMenu')}
          activeOpacity={0.8}
        >
          <Text style={styles.backButtonText}>Back to Main Menu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: currentTheme.spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  icon: {
    fontSize: 80,
    marginBottom: currentTheme.spacing.xl,
  },
  title: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.base,
  },
  comingSoon: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.primary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.xl,
  },
  description: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing.lg,
    lineHeight: 24,
  },
  message: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: currentTheme.spacing['4xl'],
    lineHeight: 22,
  },
  backButton: {
    backgroundColor: currentTheme.colors.primary,
    paddingVertical: currentTheme.spacing.lg,
    paddingHorizontal: currentTheme.spacing['2xl'],
    borderRadius: currentTheme.borderRadius.lg,
    ...currentTheme.shadows.base,
  },
  backButtonText: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.background,
    textAlign: 'center',
  },
});

export default ComingSoonScreen;
