import { Platform } from 'react-native';
import Tts from 'react-native-tts';

export interface TTSOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export interface IOSTTSOptions extends TTSOptions {
  iosVoiceId?: string;
}

export interface AndroidTTSOptions extends TTSOptions {
  androidParams?: {
    KEY_PARAM_PAN?: number;
    KEY_PARAM_VOLUME?: number;
    KEY_PARAM_STREAM?: string;
  };
}

interface Voice {
  id: string;
  name: string;
  language: string;
  quality?: number;
  networkConnectionRequired?: boolean;
  notInstalled?: boolean;
}

interface VoiceCache {
  [language: string]: string | null;
}

// iOS voice IDs for various languages
// Note: iOS provides no API to trigger voice downloads. AVSpeechSynthesisVoice.speechVoices()
// returns only voices already present on the device. Users must manually download voices via:
// Settings → Accessibility → Live Speech (iOS 17-18) or Spoken Content (iOS 16) → Voices
//
// Voice quality levels (from react-native-tts):
// - quality: 500 = Enhanced/Premium voices (100-200MB each, best quality)
// - quality: 300 = Compact/Default voices (smaller size, pre-installed)
const IOS_PREMIUM_VOICES: { [key: string]: string[] } = {
  'en-US': [
    'com.apple.voice.premium.en-US.Samantha',
    'com.apple.voice.premium.en-US.Alex',
    'com.apple.voice.enhanced.en-US.Samantha',
    'com.apple.ttsbundle.Samantha-compact',
  ],
  'fr-FR': [
    'com.apple.voice.premium.fr-FR.Thomas',
    'com.apple.voice.premium.fr-FR.Amelie',
    'com.apple.voice.enhanced.fr-FR.Thomas',
    'com.apple.ttsbundle.Thomas-compact',
  ],
  'es-ES': [
    'com.apple.voice.premium.es-ES.Monica',
    'com.apple.voice.premium.es-ES.Jorge',
    'com.apple.voice.enhanced.es-ES.Monica',
    'com.apple.ttsbundle.Monica-compact',
  ],
  'de-DE': [
    'com.apple.voice.premium.de-DE.Anna',
    'com.apple.voice.premium.de-DE.Helena',
    'com.apple.voice.enhanced.de-DE.Anna',
    'com.apple.ttsbundle.Anna-compact',
  ],
  'it-IT': [
    'com.apple.voice.premium.it-IT.Alice',
    'com.apple.voice.enhanced.it-IT.Alice',
    'com.apple.ttsbundle.Alice-compact',
  ],
  'pt-BR': [
    'com.apple.voice.premium.pt-BR.Luciana',
    'com.apple.voice.enhanced.pt-BR.Luciana',
    'com.apple.ttsbundle.Luciana-compact',
  ],
  'ja-JP': [
    'com.apple.voice.premium.ja-JP.Kyoko',
    'com.apple.voice.enhanced.ja-JP.Kyoko',
    'com.apple.ttsbundle.Kyoko-compact',
  ],
  'zh-CN': [
    'com.apple.voice.premium.zh-CN.Ting-Ting',
    'com.apple.voice.enhanced.zh-CN.Ting-Ting',
    'com.apple.ttsbundle.Ting-Ting-compact',
  ],
  'ko-KR': [
    'com.apple.voice.premium.ko-KR.Yuna',
    'com.apple.voice.enhanced.ko-KR.Yuna',
    'com.apple.ttsbundle.Yuna-compact',
  ],
  'ru-RU': [
    'com.apple.voice.premium.ru-RU.Milena',
    'com.apple.voice.enhanced.ru-RU.Milena',
    'com.apple.ttsbundle.Milena-compact',
  ],
  'uk-UA': [
    'com.apple.voice.enhanced.uk-UA.Lesya',
    'com.apple.voice.premium.uk-UA.Lesya',
    'com.apple.ttsbundle.Lesya-compact',
  ],
};

// Minimum quality threshold for Android voices (400 = high quality, 500 = neural/premium)
const ANDROID_MIN_QUALITY = 400;

class TTSService {
  private static instance: TTSService;
  private isInitialized: boolean = false;
  private hasLoggedVoices: boolean = false;
  private voiceCache: VoiceCache = {};
  private availableVoices: Voice[] = [];
  private userPreferredVoices: { [languageCode: string]: string } = {};

  private constructor() {}

  public static getInstance(): TTSService {
    if (!TTSService.instance) {
      TTSService.instance = new TTSService();
    }
    return TTSService.instance;
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Set default TTS settings
      await Tts.setDefaultRate(0.5);
      await Tts.setDefaultPitch(1.0);

      // Set default language if possible
      if (Platform.OS === 'ios') {
        await Tts.setDefaultLanguage('en-US');
      } else {
        await Tts.setDefaultLanguage('en');
      }

      // Load available voices
      await this.loadAvailableVoices();

      this.isInitialized = true;
    } catch (error) {
      console.warn('TTS initialization warning:', error);
      // Don't throw error, continue with defaults
      this.isInitialized = true;
    }
  }

  private async loadAvailableVoices(): Promise<void> {
    try {
      const voices = await Tts.voices();
      this.availableVoices = voices as Voice[];

      if (!this.hasLoggedVoices) {
        console.log('=== TTS Voices Available ===');
        console.log(`Total voices: ${voices.length}`);

        if (Platform.OS === 'android') {
          const highQuality = this.availableVoices.filter(
            v => !v.networkConnectionRequired && !v.notInstalled && (v.quality ?? 0) >= ANDROID_MIN_QUALITY
          );
          console.log(`High-quality offline voices: ${highQuality.length}`);
        }

        this.hasLoggedVoices = true;
      }
    } catch (error) {
      console.warn('Failed to load TTS voices:', error);
    }
  }

  /**
   * Set user-preferred voices for languages (e.g., from settings)
   * This allows users to override the automatic voice selection.
   */
  public setUserPreferredVoices(preferredVoices: { [languageCode: string]: string }): void {
    this.userPreferredVoices = preferredVoices;
    // Clear cache so new preferences take effect
    this.voiceCache = {};
  }

  /**
   * Get the best available voice for a given language
   * Priority: User preference > Premium/Enhanced > Compact (falls back to auto-selection)
   * Checks user preferences first, then falls back to automatic selection
   * On iOS: Prefers premium > enhanced > compact voices
   * On Android: Prefers highest quality offline voices (quality >= 400)
   */
  private async getBestVoiceForLanguage(languageCode: string): Promise<string | null> {
    // Check cache first
    if (this.voiceCache[languageCode]) {
      return this.voiceCache[languageCode];
    }

    await this.initialize();

    // Check if user has a preferred voice for this language
    if (this.userPreferredVoices[languageCode]) {
      const preferredVoiceId = this.userPreferredVoices[languageCode];
      const voice = this.availableVoices.find((v) => v.id === preferredVoiceId);

      // Only use the preferred voice if it's installed and available offline
      if (voice && !voice.notInstalled && !voice.networkConnectionRequired) {
        console.log(`Using user-preferred voice for ${languageCode}: ${voice.name}`);
        this.voiceCache[languageCode] = preferredVoiceId;
        return preferredVoiceId;
      } else {
        console.warn(
          `User-preferred voice for ${languageCode} is not available offline. Falling back to automatic selection.`
        );
      }
    }

    // Fall back to automatic selection
    if (Platform.OS === 'ios') {
      return this.getBestIOSVoice(languageCode);
    } else {
      return this.getBestAndroidVoice(languageCode);
    }
  }

  private getBestIOSVoice(languageCode: string): string | null {
    const preferredVoices = IOS_PREMIUM_VOICES[languageCode];

    if (!preferredVoices) {
      console.warn(`No premium voice configuration for language: ${languageCode}`);
      return null;
    }

    // Find the first available voice from the preference list
    for (const voiceId of preferredVoices) {
      const voice = this.availableVoices.find(v => v.id === voiceId);
      if (voice) {
        console.log(`Selected iOS voice: ${voice.name} (${voiceId})`);
        this.voiceCache[languageCode] = voiceId;
        return voiceId;
      }
    }

    console.warn(`No premium voices found for ${languageCode}. Using system default.`);
    this.voiceCache[languageCode] = null;
    return null;
  }

  private getBestAndroidVoice(languageCode: string): string | null {
    // Normalize language code (Android uses 'en', 'fr', etc.)
    const baseLanguage = languageCode.split('-')[0];

    // Filter voices for this language that are:
    // 1. Offline (not network-required)
    // 2. Installed
    // 3. High quality (>= 400)
    const suitableVoices = this.availableVoices.filter(v => {
      const voiceLang = v.language.split('-')[0].toLowerCase();
      return (
        voiceLang === baseLanguage.toLowerCase() &&
        !v.networkConnectionRequired &&
        !v.notInstalled &&
        (v.quality ?? 0) >= ANDROID_MIN_QUALITY
      );
    });

    if (suitableVoices.length === 0) {
      console.warn(`No high-quality offline voices found for ${languageCode}`);
      // Fall back to any installed offline voice
      const fallbackVoices = this.availableVoices.filter(v => {
        const voiceLang = v.language.split('-')[0].toLowerCase();
        return (
          voiceLang === baseLanguage.toLowerCase() &&
          !v.networkConnectionRequired &&
          !v.notInstalled
        );
      });

      if (fallbackVoices.length > 0) {
        const fallback = fallbackVoices[0];
        console.log(`Using fallback Android voice: ${fallback.name} (quality: ${fallback.quality ?? 'unknown'})`);
        this.voiceCache[languageCode] = fallback.id;
        return fallback.id;
      }

      this.voiceCache[languageCode] = null;
      return null;
    }

    // Sort by quality (highest first)
    suitableVoices.sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0));

    const bestVoice = suitableVoices[0];
    console.log(`Selected Android voice: ${bestVoice.name} (quality: ${bestVoice.quality})`);
    this.voiceCache[languageCode] = bestVoice.id;

    return bestVoice.id;
  }

  public async speak(text: string, options?: IOSTTSOptions | AndroidTTSOptions): Promise<string | void> {
    await this.initialize();

    if (!text || text.trim().length === 0) {
      console.warn('TTS: Empty text provided');
      return;
    }

    try {
      if (Platform.OS === 'ios') {
        const iosOptions = options as IOSTTSOptions;
        return await Tts.speak(text, {
          iosVoiceId: iosOptions?.iosVoiceId,
          rate: iosOptions?.rate ?? 0.5,
        });
      } else {
        const androidOptions = options as AndroidTTSOptions;
        return await Tts.speak(text, {
          androidParams: {
            KEY_PARAM_PAN: androidOptions?.androidParams?.KEY_PARAM_PAN ?? 0,
            KEY_PARAM_VOLUME: androidOptions?.androidParams?.KEY_PARAM_VOLUME ?? 1.0,
            KEY_PARAM_STREAM: androidOptions?.androidParams?.KEY_PARAM_STREAM ?? 'STREAM_MUSIC',
            ...androidOptions?.androidParams,
          },
        });
      }
    } catch (error) {
      console.error('TTS speak error:', error);
      throw error;
    }
  }

  /**
   * Speak text in a specific language with automatic best-voice selection
   */
  public async speakInLanguage(text: string, languageCode: string, options?: TTSOptions): Promise<string | void> {
    await this.initialize();

    // Get the best voice for this language
    const voiceId = await this.getBestVoiceForLanguage(languageCode);

    // Set the language
    await this.setLanguage(languageCode);

    // If we found a specific voice, use it
    if (voiceId && Platform.OS === 'ios') {
      return this.speak(text, {
        ...options,
        iosVoiceId: voiceId,
      } as IOSTTSOptions);
    } else if (voiceId && Platform.OS === 'android') {
      // On Android, set the voice using setDefaultVoice if available
      try {
        await Tts.setDefaultVoice(voiceId);
      } catch (error) {
        console.warn('Failed to set Android voice:', error);
      }
      return this.speak(text, options as AndroidTTSOptions);
    } else {
      // No specific voice found, use system default for the language
      return this.speak(text, options as IOSTTSOptions | AndroidTTSOptions);
    }
  }

  public async stop(): Promise<void> {
    try {
      await Tts.stop();
    } catch (error) {
      console.error('TTS stop error:', error);
    }
  }

  public async getVoices(): Promise<unknown[]> {
    await this.initialize();
    try {
      return await Tts.voices();
    } catch (error) {
      console.error('TTS get voices error:', error);
      return [];
    }
  }

  public async setLanguage(language: string): Promise<void> {
    await this.initialize();
    try {
      await Tts.setDefaultLanguage(language);
    } catch (error) {
      console.error('TTS set language error:', error);
    }
  }

  public async setRate(rate: number): Promise<void> {
    await this.initialize();
    try {
      await Tts.setDefaultRate(rate);
    } catch (error) {
      console.error('TTS set rate error:', error);
    }
  }

  public async setPitch(pitch: number): Promise<void> {
    await this.initialize();
    try {
      await Tts.setDefaultPitch(pitch);
    } catch (error) {
      console.error('TTS set pitch error:', error);
    }
  }

  /**
   * Language name to language code mapping
   */
  private getLanguageCode(languageName: string): string {
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
      'ukrainian': Platform.OS === 'ios' ? 'uk-UA' : 'uk',
    };

    return languageMap[languageName.toLowerCase()] || (Platform.OS === 'ios' ? 'en-US' : 'en');
  }

  // Convenience methods for common language settings
  public async speakFrench(text: string, options?: TTSOptions): Promise<string | void> {
    const languageCode = Platform.OS === 'ios' ? 'fr-FR' : 'fr';
    return this.speakInLanguage(text, languageCode, options);
  }

  public async speakEnglish(text: string, options?: TTSOptions): Promise<string | void> {
    const languageCode = Platform.OS === 'ios' ? 'en-US' : 'en';
    return this.speakInLanguage(text, languageCode, options);
  }

  public async speakSpanish(text: string, options?: TTSOptions): Promise<string | void> {
    const languageCode = Platform.OS === 'ios' ? 'es-ES' : 'es';
    return this.speakInLanguage(text, languageCode, options);
  }

  public async speakGerman(text: string, options?: TTSOptions): Promise<string | void> {
    const languageCode = Platform.OS === 'ios' ? 'de-DE' : 'de';
    return this.speakInLanguage(text, languageCode, options);
  }

  public async speakItalian(text: string, options?: TTSOptions): Promise<string | void> {
    const languageCode = Platform.OS === 'ios' ? 'it-IT' : 'it';
    return this.speakInLanguage(text, languageCode, options);
  }

  public async speakPortuguese(text: string, options?: TTSOptions): Promise<string | void> {
    const languageCode = Platform.OS === 'ios' ? 'pt-BR' : 'pt';
    return this.speakInLanguage(text, languageCode, options);
  }

  /**
   * Speak with automatic language detection based on user's language setting
   */
  public async speakWithLanguageDetection(text: string, userLanguage: string = 'French', options?: TTSOptions): Promise<string | void> {
    const languageCode = this.getLanguageCode(userLanguage);
    return this.speakInLanguage(text, languageCode, options);
  }

  /**
   * Get voice quality info for a language (useful for UI/debugging)
   */
  public async getVoiceQualityInfo(languageCode: string): Promise<{ hasHighQuality: boolean; voiceName?: string; quality?: number }> {
    await this.initialize();
    const voiceId = await this.getBestVoiceForLanguage(languageCode);

    if (!voiceId) {
      return { hasHighQuality: false };
    }

    const voice = this.availableVoices.find(v => v.id === voiceId);
    if (!voice) {
      return { hasHighQuality: false };
    }

    const isHighQuality = Platform.OS === 'ios'
      ? voiceId.includes('premium') || voiceId.includes('enhanced')
      : (voice.quality ?? 0) >= ANDROID_MIN_QUALITY;

    return {
      hasHighQuality: isHighQuality,
      voiceName: voice.name,
      quality: voice.quality,
    };
  }

  /**
   * Get all available voices for a specific language
   * Useful for building voice selection UI in settings
   */
  public async getAvailableVoicesForLanguage(languageCode: string): Promise<Voice[]> {
    await this.initialize();
    const baseLanguage = languageCode.split('-')[0].toLowerCase();

    return this.availableVoices.filter(v => {
      const voiceLang = v.language.split('-')[0].toLowerCase();
      return voiceLang === baseLanguage;
    });
  }

  /**
   * Get all available voices (all languages)
   * Useful for building comprehensive voice settings UI
   */
  public async getAllAvailableVoices(): Promise<Voice[]> {
    await this.initialize();
    return this.availableVoices;
  }
}

export default TTSService.getInstance();
