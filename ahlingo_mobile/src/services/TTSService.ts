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

class TTSService {
  private static instance: TTSService;
  private isInitialized: boolean = false;
  private hasLoggedVoices: boolean = false;

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

      this.isInitialized = true;
    } catch (error) {
      console.warn('TTS initialization warning:', error);
      // Don't throw error, continue with defaults
      this.isInitialized = true;
    }
  }

  private async logAvailableVoices(): Promise<void> {
    if (this.hasLoggedVoices) return;

    try {
      const voices = await Tts.voices();
      console.log('Available TTS voices:', voices);
      this.hasLoggedVoices = true;
    } catch (error) {
      console.warn('Failed to get TTS voices:', error);
    }
  }

  public async speak(text: string, options?: IOSTTSOptions | AndroidTTSOptions): Promise<string | void> {
    await this.initialize();
    await this.logAvailableVoices();

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

  // Convenience methods for common language settings
  public async speakFrench(text: string, options?: TTSOptions): Promise<string | void> {
    const languageCode = Platform.OS === 'ios' ? 'fr-FR' : 'fr';
    await this.setLanguage(languageCode);
    
    if (Platform.OS === 'ios') {
      return this.speak(text, {
        ...options,
        iosVoiceId: 'com.apple.ttsbundle.Moira-compact', // Example French voice
      } as IOSTTSOptions);
    } else {
      return this.speak(text, options as AndroidTTSOptions);
    }
  }

  public async speakEnglish(text: string, options?: TTSOptions): Promise<string | void> {
    const languageCode = Platform.OS === 'ios' ? 'en-US' : 'en';
    await this.setLanguage(languageCode);
    return this.speak(text, options as IOSTTSOptions | AndroidTTSOptions);
  }

  // Method to determine language from text context or settings
  public async speakWithLanguageDetection(text: string, userLanguage: string = 'French', options?: TTSOptions): Promise<string | void> {
    switch (userLanguage.toLowerCase()) {
      case 'french':
        return this.speakFrench(text, options);
      case 'english':
        return this.speakEnglish(text, options);
      default:
        // Default to English for unknown languages
        return this.speakEnglish(text, options);
    }
  }
}

export default TTSService.getInstance();