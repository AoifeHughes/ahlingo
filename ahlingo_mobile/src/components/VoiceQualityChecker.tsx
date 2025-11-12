import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { TTSVoiceHelper, VoiceAvailability } from '../utils/TTSVoiceHelper';
import { useTheme } from '../contexts/ThemeContext';

interface VoiceQualityCheckerProps {
  /**
   * Languages to check (e.g., ['English', 'French', 'Spanish'])
   */
  languages: string[];

  /**
   * Whether to show detailed information for each language
   */
  showDetails?: boolean;

  /**
   * Whether to automatically prompt user if voices are missing
   */
  autoPrompt?: boolean;
}

/**
 * Component that checks TTS voice quality and helps users download premium voices
 * Can be used in Settings or as part of onboarding
 */
const VoiceQualityChecker: React.FC<VoiceQualityCheckerProps> = ({
  languages,
  showDetails = false,
  autoPrompt = false,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [loading, setLoading] = useState(true);
  const [voiceAvailability, setVoiceAvailability] = useState<VoiceAvailability[]>([]);
  const [allHighQuality, setAllHighQuality] = useState(false);

  useEffect(() => {
    checkVoices();
  }, [languages]);

  const checkVoices = async () => {
    setLoading(true);
    try {
      const availability = await TTSVoiceHelper.checkVoiceAvailability(languages);
      setVoiceAvailability(availability);

      const missingLanguages = availability.filter(a => !a.hasHighQuality).map(a => a.language);
      setAllHighQuality(missingLanguages.length === 0);

      // Auto-prompt if enabled and voices are missing
      if (autoPrompt && missingLanguages.length > 0) {
        TTSVoiceHelper.promptToDownloadVoices(missingLanguages);
      }
    } catch (error) {
      console.error('Error checking voice availability:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPrompt = () => {
    const missingLanguages = voiceAvailability
      .filter(a => !a.hasHighQuality)
      .map(a => a.language);
    TTSVoiceHelper.promptToDownloadVoices(missingLanguages);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Checking voice quality...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Quality</Text>
        {allHighQuality ? (
          <View style={styles.badge}>
            <Text style={styles.badgeTextGood}>✓ High Quality</Text>
          </View>
        ) : (
          <View style={[styles.badge, styles.badgeWarning]}>
            <Text style={styles.badgeTextWarning}>⚠ Can Improve</Text>
          </View>
        )}
      </View>

      {showDetails && (
        <View style={styles.detailsContainer}>
          {voiceAvailability.map((availability, index) => (
            <View key={index} style={styles.languageRow}>
              <Text style={styles.languageName}>{availability.language}</Text>
              <View style={styles.languageStatus}>
                {availability.hasHighQuality ? (
                  <>
                    <Text style={styles.qualityGood}>✓</Text>
                    {availability.voiceName && (
                      <Text style={styles.voiceName}>{availability.voiceName}</Text>
                    )}
                  </>
                ) : (
                  <Text style={styles.qualityWarning}>Standard quality</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {!allHighQuality && (
        <TouchableOpacity
          style={styles.button}
          onPress={handleDownloadPrompt}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Download Better Voices</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.helpText}>
        {allHighQuality
          ? 'You have the best available voices for natural pronunciation.'
          : 'Download premium voices for more natural pronunciation and better learning.'}
      </Text>
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      padding: currentTheme.spacing.md,
      backgroundColor: currentTheme.colors.background,
      borderRadius: currentTheme.borderRadius.base,
      ...currentTheme.shadows.base,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: currentTheme.spacing.md,
    },
    title: {
      fontSize: currentTheme.typography.fontSizes.lg,
      fontWeight: currentTheme.typography.fontWeights.semibold,
      color: currentTheme.colors.text,
    },
    badge: {
      paddingHorizontal: currentTheme.spacing.sm,
      paddingVertical: currentTheme.spacing.xs,
      borderRadius: currentTheme.borderRadius.sm,
      backgroundColor: currentTheme.colors.success,
    },
    badgeWarning: {
      backgroundColor: currentTheme.colors.warning || '#FFA500',
    },
    badgeTextGood: {
      color: currentTheme.colors.background,
      fontSize: currentTheme.typography.fontSizes.sm,
      fontWeight: currentTheme.typography.fontWeights.semibold,
    },
    badgeTextWarning: {
      color: currentTheme.colors.text,
      fontSize: currentTheme.typography.fontSizes.sm,
      fontWeight: currentTheme.typography.fontWeights.semibold,
    },
    loadingText: {
      marginTop: currentTheme.spacing.sm,
      color: currentTheme.colors.text,
      fontSize: currentTheme.typography.fontSizes.sm,
    },
    detailsContainer: {
      marginBottom: currentTheme.spacing.md,
    },
    languageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: currentTheme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border || '#E0E0E0',
    },
    languageName: {
      fontSize: currentTheme.typography.fontSizes.md,
      color: currentTheme.colors.text,
    },
    languageStatus: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    qualityGood: {
      color: currentTheme.colors.success,
      fontSize: currentTheme.typography.fontSizes.md,
      marginRight: currentTheme.spacing.xs,
    },
    qualityWarning: {
      color: currentTheme.colors.warning || '#FFA500',
      fontSize: currentTheme.typography.fontSizes.sm,
    },
    voiceName: {
      fontSize: currentTheme.typography.fontSizes.xs,
      color: currentTheme.colors.textSecondary || currentTheme.colors.text,
    },
    button: {
      backgroundColor: currentTheme.colors.primary,
      paddingVertical: currentTheme.spacing.md,
      paddingHorizontal: currentTheme.spacing.lg,
      borderRadius: currentTheme.borderRadius.base,
      alignItems: 'center',
      marginBottom: currentTheme.spacing.sm,
      ...currentTheme.shadows.base,
    },
    buttonText: {
      color: currentTheme.colors.background,
      fontSize: currentTheme.typography.fontSizes.md,
      fontWeight: currentTheme.typography.fontWeights.semibold,
    },
    helpText: {
      fontSize: currentTheme.typography.fontSizes.sm,
      color: currentTheme.colors.textSecondary || currentTheme.colors.text,
      textAlign: 'center',
      lineHeight: 20,
    },
  });

export default VoiceQualityChecker;
