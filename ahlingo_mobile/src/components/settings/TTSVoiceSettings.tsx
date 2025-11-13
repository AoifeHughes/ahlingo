import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import TTSService from '../../services/TTSService';
import { TTSVoiceHelper } from '../../utils/TTSVoiceHelper';

interface Voice {
  id: string;
  name: string;
  language: string;
  quality?: number;
  networkConnectionRequired?: boolean;
  notInstalled?: boolean;
}

interface GroupedVoices {
  [language: string]: Voice[];
}

interface TTSVoiceSettingsProps {
  selectedLanguages: string[]; // e.g., ['French', 'Spanish']
  preferredVoices: { [languageCode: string]: string }; // Map of language code to voice ID
  onVoiceChange: (languageCode: string, voiceId: string) => void;
}

const LANGUAGE_CODE_MAP: Array<{ keywords: string[]; ios: string; android: string }> = [
  { keywords: ['english'], ios: 'en-US', android: 'en' },
  { keywords: ['french'], ios: 'fr-FR', android: 'fr' },
  { keywords: ['spanish', 'español'], ios: 'es-ES', android: 'es' },
  { keywords: ['german', 'deutsch'], ios: 'de-DE', android: 'de' },
  { keywords: ['italian'], ios: 'it-IT', android: 'it' },
  { keywords: ['portuguese', 'brazil'], ios: 'pt-BR', android: 'pt' },
  { keywords: ['japanese'], ios: 'ja-JP', android: 'ja' },
  { keywords: ['chinese', 'mandarin'], ios: 'zh-CN', android: 'zh' },
  { keywords: ['korean'], ios: 'ko-KR', android: 'ko' },
  { keywords: ['russian'], ios: 'ru-RU', android: 'ru' },
  { keywords: ['ukrainian'], ios: 'uk-UA', android: 'uk' },
];

const TTSVoiceSettings: React.FC<TTSVoiceSettingsProps> = ({
  selectedLanguages,
  preferredVoices,
  onVoiceChange,
}) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);

  const [loading, setLoading] = useState(true);
  const [groupedVoices, setGroupedVoices] = useState<GroupedVoices>({});
  const [expandedLanguages, setExpandedLanguages] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadVoices();
  }, [selectedLanguages]);

  const loadVoices = async () => {
    setLoading(true);
    try {
      const allVoices = (await TTSService.getVoices()) as Voice[];

      // Group voices by language
      const grouped: GroupedVoices = {};

      selectedLanguages.forEach(langName => {
        const languageCode = getLanguageCode(langName);
        const baseLanguage = languageCode.split('-')[0].toLowerCase();

        // Find voices for this language
        let languageVoices = allVoices.filter(v => {
          const voiceLang = v.language.split('-')[0].toLowerCase();
          return voiceLang === baseLanguage;
        });

        const dedupedVoices: Voice[] = [];
        const seenVoiceIds = new Set<string>();
        languageVoices.forEach(voice => {
          if (!seenVoiceIds.has(voice.id)) {
            seenVoiceIds.add(voice.id);
            dedupedVoices.push(voice);
          }
        });

        languageVoices = dedupedVoices;

        // Sort voices: premium/high quality first, installed before not installed
        languageVoices.sort((a, b) => {
          // First, prioritize installed voices
          const aInstalled = !a.notInstalled && !a.networkConnectionRequired;
          const bInstalled = !b.notInstalled && !b.networkConnectionRequired;
          if (aInstalled !== bInstalled) {
            return aInstalled ? -1 : 1;
          }

          // Then sort by quality
          const aQuality = a.quality ?? 0;
          const bQuality = b.quality ?? 0;
          if (aQuality !== bQuality) {
            return bQuality - aQuality;
          }

          // Finally, check for premium in iOS voice IDs
          if (Platform.OS === 'ios') {
            const aPremium = a.id.includes('premium') ? 2 : a.id.includes('enhanced') ? 1 : 0;
            const bPremium = b.id.includes('premium') ? 2 : b.id.includes('enhanced') ? 1 : 0;
            return bPremium - aPremium;
          }

          return 0;
        });

        grouped[languageCode] = languageVoices;
      });

      setGroupedVoices(grouped);
    } catch (error) {
      console.error('Failed to load voices:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLanguageCode = (languageName: string): string => {
    const normalized = languageName.toLowerCase();
    const match = LANGUAGE_CODE_MAP.find(entry =>
      entry.keywords.some(keyword => normalized.includes(keyword))
    );

    if (match) {
      return Platform.OS === 'ios' ? match.ios : match.android;
    }

    return Platform.OS === 'ios' ? 'en-US' : 'en';
  };

  const toggleLanguage = (languageCode: string) => {
    setExpandedLanguages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(languageCode)) {
        newSet.delete(languageCode);
      } else {
        newSet.add(languageCode);
      }
      return newSet;
    });
  };

  const getVoiceQualityBadge = (voice: Voice): { text: string; color: string } => {
    if (voice.notInstalled) {
      return { text: 'Not Installed', color: theme.colors.error };
    }

    if (voice.networkConnectionRequired) {
      return { text: 'Requires Network', color: theme.colors.warning || '#FFA500' };
    }

    // Both iOS and Android use the quality field consistently
    // iOS: 300 = compact/default, 500 = enhanced/premium
    // Android: 300+ = normal, 400+ = high quality, 500+ = neural
    const quality = voice.quality ?? 0;

    if (Platform.OS === 'ios') {
      if (quality >= 500) {
        // Enhanced or Premium voices
        return { text: 'Premium', color: theme.colors.success };
      } else if (quality >= 300) {
        // Compact/default voices
        return { text: 'Compact', color: theme.colors.textSecondary || theme.colors.text };
      }
      return { text: 'Standard', color: theme.colors.textSecondary || theme.colors.text };
    } else {
      // Android quality levels
      if (quality >= 500) {
        return { text: 'Neural', color: theme.colors.success };
      } else if (quality >= 400) {
        return { text: 'High Quality', color: theme.colors.secondary };
      } else if (quality >= 300) {
        return { text: 'Normal', color: theme.colors.textSecondary || theme.colors.text };
      } else {
        return { text: 'Low Quality', color: theme.colors.warning || '#FFA500' };
      }
    }
  };

  const handleVoiceSelect = (languageCode: string, voiceId: string) => {
    onVoiceChange(languageCode, voiceId);
  };

  const handleDownloadPrompt = () => {
    const missingLanguages = selectedLanguages.filter(langName => {
      const languageCode = getLanguageCode(langName);
      const voices = groupedVoices[languageCode] || [];
      const hasHighQuality = voices.some(v => !v.notInstalled && (v.quality ?? 0) >= 400);
      return !hasHighQuality;
    });

    if (missingLanguages.length > 0) {
      TTSVoiceHelper.promptToDownloadVoices(missingLanguages);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading voices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Text-to-Speech Voices</Text>
        <Text style={styles.subtitle}>
          Choose your preferred voice for each language. Premium/Enhanced voices (quality: 500) provide better pronunciation than Compact voices (quality: 300). Only voices already downloaded on your device are shown.
        </Text>
      </View>

      <TouchableOpacity style={styles.downloadButton} onPress={handleDownloadPrompt}>
        <Text style={styles.downloadButtonText}>📥 Download Premium Voices</Text>
      </TouchableOpacity>

      <ScrollView style={styles.languageList} showsVerticalScrollIndicator={false}>
        {selectedLanguages.map((langName, index) => {
          const languageCode = getLanguageCode(langName);
          const voices = groupedVoices[languageCode] || [];
          const isExpanded = expandedLanguages.has(languageCode);
          const selectedVoiceId = preferredVoices[languageCode];

          // Get currently selected voice info
          const selectedVoice = voices.find(v => v.id === selectedVoiceId);
          const selectedVoiceDisplay = selectedVoice
            ? `${selectedVoice.name} (${getVoiceQualityBadge(selectedVoice).text})`
            : 'Auto-select best';

          return (
            <View key={`${languageCode}-${index}`} style={styles.languageSection}>
              <TouchableOpacity
                style={styles.languageHeader}
                onPress={() => toggleLanguage(languageCode)}
              >
                <View style={styles.languageHeaderLeft}>
                  <Text style={styles.languageName}>{langName}</Text>
                  <Text style={styles.selectedVoice}>{selectedVoiceDisplay}</Text>
                </View>
                <Text style={styles.expandIcon}>{isExpanded ? '▼' : '▶'}</Text>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.voiceList}>
                  {/* Auto-select option */}
                  <TouchableOpacity
                    style={[
                      styles.voiceItem,
                      !selectedVoiceId && styles.voiceItemSelected,
                    ]}
                    onPress={() => handleVoiceSelect(languageCode, '')}
                  >
                    <View style={styles.voiceInfo}>
                      <Text style={[styles.voiceName, !selectedVoiceId && styles.voiceNameSelected]}>
                        Auto-select best
                      </Text>
                      <Text style={styles.voiceDescription}>
                        Automatically choose the highest quality voice available
                      </Text>
                    </View>
                    {!selectedVoiceId && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>

                  {voices.map(voice => {
                    const badge = getVoiceQualityBadge(voice);
                    const isSelected = selectedVoiceId === voice.id;
                    const isAvailable = !voice.notInstalled && !voice.networkConnectionRequired;

                    return (
                      <TouchableOpacity
                        key={voice.id}
                        style={[
                          styles.voiceItem,
                          isSelected && styles.voiceItemSelected,
                          !isAvailable && styles.voiceItemDisabled,
                        ]}
                        onPress={() => isAvailable && handleVoiceSelect(languageCode, voice.id)}
                        disabled={!isAvailable}
                      >
                        <View style={styles.voiceInfo}>
                          <View style={styles.voiceNameRow}>
                            <Text style={[styles.voiceName, isSelected && styles.voiceNameSelected]}>
                              {voice.name}
                            </Text>
                            <View style={[styles.badge, { backgroundColor: badge.color }]}>
                              <Text style={styles.badgeText}>{badge.text}</Text>
                            </View>
                          </View>
                          {Platform.OS === 'android' && voice.quality !== undefined && (
                            <Text style={styles.voiceDescription}>Quality: {voice.quality}</Text>
                          )}
                        </View>
                        {isSelected && <Text style={styles.checkmark}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}

                  {voices.length === 0 && (
                    <Text style={styles.noVoices}>No voices available for this language</Text>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (currentTheme: ReturnType<typeof useTheme>['theme']) =>
  StyleSheet.create({
    container: {
      marginTop: currentTheme.spacing.lg,
      backgroundColor: currentTheme.colors.surface,
      borderRadius: currentTheme.borderRadius.base,
      padding: currentTheme.spacing.lg,
      ...currentTheme.shadows.base,
    },
    header: {
      marginBottom: currentTheme.spacing.md,
    },
    title: {
      fontSize: currentTheme.typography.fontSizes.xl,
      fontWeight: currentTheme.typography.fontWeights.bold,
      color: currentTheme.colors.text,
      marginBottom: currentTheme.spacing.xs,
    },
    subtitle: {
      fontSize: currentTheme.typography.fontSizes.sm,
      color: currentTheme.colors.textSecondary || currentTheme.colors.text,
      lineHeight: 18,
    },
    loadingText: {
      marginTop: currentTheme.spacing.sm,
      color: currentTheme.colors.text,
      fontSize: currentTheme.typography.fontSizes.sm,
    },
    downloadButton: {
      backgroundColor: currentTheme.colors.secondary,
      padding: currentTheme.spacing.md,
      borderRadius: currentTheme.borderRadius.base,
      marginBottom: currentTheme.spacing.lg,
      alignItems: 'center',
    },
    downloadButtonText: {
      color: currentTheme.colors.background,
      fontSize: currentTheme.typography.fontSizes.md,
      fontWeight: currentTheme.typography.fontWeights.semibold,
    },
    languageList: {
      maxHeight: 600,
    },
    languageSection: {
      marginBottom: currentTheme.spacing.md,
      borderWidth: 1,
      borderColor: currentTheme.colors.border || '#E0E0E0',
      borderRadius: currentTheme.borderRadius.base,
      overflow: 'hidden',
    },
    languageHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: currentTheme.spacing.md,
      backgroundColor: currentTheme.colors.background,
    },
    languageHeaderLeft: {
      flex: 1,
    },
    languageName: {
      fontSize: currentTheme.typography.fontSizes.lg,
      fontWeight: currentTheme.typography.fontWeights.semibold,
      color: currentTheme.colors.text,
    },
    selectedVoice: {
      fontSize: currentTheme.typography.fontSizes.sm,
      color: currentTheme.colors.textSecondary || currentTheme.colors.text,
      marginTop: 2,
    },
    expandIcon: {
      fontSize: currentTheme.typography.fontSizes.sm,
      color: currentTheme.colors.text,
      marginLeft: currentTheme.spacing.sm,
    },
    voiceList: {
      backgroundColor: currentTheme.colors.surface,
    },
    voiceItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: currentTheme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: currentTheme.colors.border || '#E0E0E0',
    },
    voiceItemSelected: {
      backgroundColor: `${currentTheme.colors.primary}15`,
    },
    voiceItemDisabled: {
      opacity: 0.5,
    },
    voiceInfo: {
      flex: 1,
    },
    voiceNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    voiceName: {
      fontSize: currentTheme.typography.fontSizes.md,
      color: currentTheme.colors.text,
      marginRight: currentTheme.spacing.sm,
    },
    voiceNameSelected: {
      fontWeight: currentTheme.typography.fontWeights.semibold,
      color: currentTheme.colors.primary,
    },
    voiceDescription: {
      fontSize: currentTheme.typography.fontSizes.xs,
      color: currentTheme.colors.textSecondary || currentTheme.colors.text,
    },
    badge: {
      paddingHorizontal: currentTheme.spacing.sm,
      paddingVertical: 2,
      borderRadius: currentTheme.borderRadius.sm,
    },
    badgeText: {
      fontSize: currentTheme.typography.fontSizes.xs,
      color: currentTheme.colors.background,
      fontWeight: currentTheme.typography.fontWeights.semibold,
    },
    checkmark: {
      fontSize: currentTheme.typography.fontSizes.lg,
      color: currentTheme.colors.success,
      marginLeft: currentTheme.spacing.sm,
    },
    noVoices: {
      padding: currentTheme.spacing.lg,
      textAlign: 'center',
      color: currentTheme.colors.textSecondary || currentTheme.colors.text,
      fontSize: currentTheme.typography.fontSizes.sm,
    },
  });

export default TTSVoiceSettings;
