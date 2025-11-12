import { Platform, Linking, Alert } from 'react-native';
import TTSService from '../services/TTSService';

export interface VoiceAvailability {
  language: string;
  languageCode: string;
  hasHighQuality: boolean;
  voiceName?: string;
  quality?: number;
}

/**
 * Helper class for checking TTS voice availability and guiding users
 * to download high-quality voices
 */
export class TTSVoiceHelper {
  /**
   * Check if high-quality voices are available for given languages
   */
  static async checkVoiceAvailability(languages: string[]): Promise<VoiceAvailability[]> {
    const results: VoiceAvailability[] = [];

    for (const language of languages) {
      const languageCode = this.getLanguageCode(language);
      const info = await TTSService.getVoiceQualityInfo(languageCode);

      results.push({
        language,
        languageCode,
        hasHighQuality: info.hasHighQuality,
        voiceName: info.voiceName,
        quality: info.quality,
      });
    }

    return results;
  }

  /**
   * Get instructions for downloading premium voices
   */
  static getDownloadInstructions(): { title: string; steps: string[] } {
    if (Platform.OS === 'ios') {
      return {
        title: 'Download Premium Voices on iOS',
        steps: [
          '1. Open Settings app',
          '2. Go to Accessibility',
          '3. Tap "Live Speech" (iOS 17-18) or "Spoken Content" (iOS 16)',
          '4. Tap "Voices"',
          '5. Select your language',
          '6. Download "Enhanced" or "Premium" quality voices (100-200MB each)',
          '',
          'Note: Apps cannot trigger voice downloads - you must download them manually in Settings.',
        ],
      };
    } else {
      return {
        title: 'Download High-Quality Voices on Android',
        steps: [
          '1. Open Settings app',
          '2. Go to System > Languages & input',
          '3. Tap "Text-to-speech output"',
          '4. Tap the settings icon next to "Google Text-to-speech Engine"',
          '5. Tap "Install voice data"',
          '6. Download high-quality voices for your languages',
        ],
      };
    }
  }

  /**
   * Show an alert prompting user to download premium voices
   */
  static promptToDownloadVoices(missingLanguages: string[]): void {
    const instructions = this.getDownloadInstructions();
    const languageList = missingLanguages.join(', ');

    Alert.alert(
      'Improve Voice Quality',
      `For the best learning experience with ${languageList}, we recommend downloading high-quality voices.\n\n${instructions.steps.join('\n')}`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
        },
        {
          text: 'Open Settings',
          onPress: () => this.openTTSSettings(),
        },
      ]
    );
  }

  /**
   * Attempt to open TTS settings
   *
   * Note: iOS provides no API to trigger voice downloads from within apps.
   * Apple's AVSpeechSynthesis framework offers no methods to request voice installations.
   * Users must manually download voices through Settings.
   */
  static async openTTSSettings(): Promise<void> {
    if (Platform.OS === 'ios') {
      // iOS doesn't allow deep-linking to specific settings pages in production apps
      // Best we can do is open main Settings app
      try {
        await Linking.openURL('app-settings:');
      } catch (error) {
        console.warn('Could not open settings:', error);
        Alert.alert(
          'Manual Steps Required',
          'Please open Settings > Accessibility > Live Speech > Voices (iOS 17-18) or Spoken Content > Voices (iOS 16) to download premium voices.'
        );
      }
    } else {
      // Android allows deep-linking to TTS settings
      try {
        await Linking.sendIntent('com.android.settings.TTS_SETTINGS');
      } catch (error) {
        console.warn('Could not open TTS settings:', error);
        // Fallback to general settings
        try {
          await Linking.openSettings();
        } catch (fallbackError) {
          console.warn('Could not open settings:', fallbackError);
        }
      }
    }
  }

  /**
   * Get a summary of available voice quality for all configured languages
   */
  static async getVoiceQualitySummary(languages: string[]): Promise<{
    allHighQuality: boolean;
    missingLanguages: string[];
    summary: string;
  }> {
    const availability = await this.checkVoiceAvailability(languages);
    const missingLanguages = availability
      .filter(a => !a.hasHighQuality)
      .map(a => a.language);

    const allHighQuality = missingLanguages.length === 0;

    let summary = '';
    if (allHighQuality) {
      summary = `High-quality voices available for all languages (${languages.join(', ')})`;
    } else {
      summary = `High-quality voices missing for: ${missingLanguages.join(', ')}`;
    }

    return {
      allHighQuality,
      missingLanguages,
      summary,
    };
  }

  private static getLanguageCode(languageName: string): string {
    const languageMap: { [key: string]: string } = {
      'english': Platform.OS === 'ios' ? 'en-US' : 'en',
      'french': Platform.OS === 'ios' ? 'fr-FR' : 'fr',
      'spanish': Platform.OS === 'ios' ? 'es-ES' : 'es',
      'german': Platform.OS === 'ios' ? 'de-DE' : 'de',
      'italian': Platform.OS === 'ios' ? 'it-IT' : 'it',
      'portuguese': Platform.OS === 'ios' ? 'pt-BR' : 'pt',
      'japanese': Platform.OS === 'ios' ? 'ja-JP' : 'ja',
      'chinese': Platform.OS === 'ios' ? 'zh-CN' : 'zh',
      'korean': Platform.OS === 'ios' ? 'ko-KR' : 'ko',
      'russian': Platform.OS === 'ios' ? 'ru-RU' : 'ru',
    };

    return languageMap[languageName.toLowerCase()] || (Platform.OS === 'ios' ? 'en-US' : 'en');
  }
}
