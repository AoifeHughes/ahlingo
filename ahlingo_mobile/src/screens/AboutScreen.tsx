import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { useTheme } from '../contexts/ThemeContext';

type AboutScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'About'
>;

interface Props {
  navigation: AboutScreenNavigationProp;
}

const AboutScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  
  const handleEmailPress = async () => {
    const email = 'aoife.deltasolutions@gmail.com';
    const subject = 'AHLingo Feedback';
    const body = 'Hi Aoife,\n\nI have some feedback/suggestions/bug reports for AHLingo:\n\n';
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    
    try {
      const supported = await Linking.canOpenURL(mailtoUrl);
      if (supported) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          'Email Not Available',
          `Please send your feedback to: ${email}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        `Could not open email client. Please contact: ${email}`,
        [{ text: 'OK' }]
      );
    }
  };

  const styles = createStyles(theme);

  return (
    <>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            testID="back-button"
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>About</Text>
        </View>

        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoContainer}>
            <Image
              source={require('../../imgs/me.png')}
              style={styles.logo}
              testID="about-logo"
            />
          </View>

          <View style={styles.appInfo}>
            <Text style={styles.appName}>AHLingo</Text>
            <Text style={styles.version}>Version 0.0.1</Text>
            <Text style={styles.description}>
              A comprehensive language learning application designed to help you master new languages through interactive exercises, conversations, and personalized learning experiences.
            </Text>
          </View>

          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact & Feedback</Text>
            <Text style={styles.contactText}>
              We'd love to hear from you! Share your feedback, suggestions, or report bugs to help us improve AHLingo.
            </Text>
            
            <TouchableOpacity
              style={styles.emailButton}
              onPress={handleEmailPress}
              testID="contact-email-button"
            >
              <Text style={styles.emailIcon}>✉️</Text>
              <View style={styles.emailTextContainer}>
                <Text style={styles.emailLabel}>Send Feedback</Text>
                <Text style={styles.emailAddress}>aoife.deltasolutions@gmail.com</Text>
              </View>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </View>
    </>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: currentTheme.colors.background,
  },
  header: {
    backgroundColor: currentTheme.colors.primary,
    paddingTop: 60,
    paddingBottom: currentTheme.spacing['3xl'],
    paddingHorizontal: currentTheme.spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...currentTheme.shadows.lg,
  },
  backButton: {
    position: 'absolute',
    left: currentTheme.spacing.xl,
    top: 60,
    width: currentTheme.spacing['5xl'],
    height: currentTheme.spacing['5xl'],
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: currentTheme.spacing.xl,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backIcon: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    color: currentTheme.colors.background,
    fontWeight: 'bold',
  },
  title: {
    fontSize: currentTheme.typography.fontSizes['4xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.background,
    textAlign: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: currentTheme.spacing.xl,
    paddingVertical: currentTheme.spacing.xl,
    paddingBottom: currentTheme.spacing['2xl'],
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: currentTheme.spacing['2xl'],
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: currentTheme.colors.primary,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: currentTheme.spacing['3xl'],
  },
  appName: {
    fontSize: currentTheme.typography.fontSizes['3xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.sm,
  },
  version: {
    fontSize: currentTheme.typography.fontSizes.lg,
    color: currentTheme.colors.textSecondary,
    marginBottom: currentTheme.spacing.lg,
  },
  description: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  contactSection: {
    marginBottom: currentTheme.spacing['3xl'],
  },
  sectionTitle: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    fontWeight: currentTheme.typography.fontWeights.bold,
    color: currentTheme.colors.text,
    marginBottom: currentTheme.spacing.lg,
  },
  contactText: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    lineHeight: 22,
    marginBottom: currentTheme.spacing.lg,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: currentTheme.colors.primary,
    borderRadius: currentTheme.spacing.lg,
    padding: currentTheme.spacing.lg,
    ...currentTheme.shadows.md,
  },
  emailIcon: {
    fontSize: currentTheme.typography.fontSizes['2xl'],
    marginRight: currentTheme.spacing.lg,
  },
  emailTextContainer: {
    flex: 1,
  },
  emailLabel: {
    fontSize: currentTheme.typography.fontSizes.lg,
    fontWeight: currentTheme.typography.fontWeights.semibold,
    color: currentTheme.colors.background,
    marginBottom: currentTheme.spacing.xs,
  },
  emailAddress: {
    fontSize: currentTheme.typography.fontSizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  featuresSection: {
    marginBottom: currentTheme.spacing.xl,
  },
  featuresList: {
    marginTop: currentTheme.spacing.sm,
  },
  featureItem: {
    fontSize: currentTheme.typography.fontSizes.base,
    color: currentTheme.colors.textSecondary,
    lineHeight: 26,
    marginBottom: currentTheme.spacing.xs,
  },
});

export default AboutScreen;