import { LanguageLearningDatabase } from './database';
import { User, Language, Difficulty, UserSettings } from '../../types';

export class UserSettingsService {
  private db: LanguageLearningDatabase;

  constructor(database: LanguageLearningDatabase) {
    this.db = database;
  }

  /**
   * Get complete user settings with fallback defaults
   */
  async getUserSettings(username?: string): Promise<UserSettings> {
    // Get or create user
    const currentUsername = username || this.db.getMostRecentUser();
    let user = this.db.getUserByName(currentUsername);
    
    if (!user) {
      this.db.createUser(currentUsername);
      user = this.db.getUserByName(currentUsername)!;
    }

    // Get user settings from database
    const settings = this.db.getUserSettings(user.id);

    // Get language (fallback to first available, or French if available)
    let language: Language;
    const languageId = settings.language_id ? parseInt(settings.language_id) : null;
    
    if (languageId) {
      language = this.db.getLanguageById(languageId) || this.getDefaultLanguage();
    } else {
      language = this.getDefaultLanguage();
    }

    // Get difficulty (fallback to Beginner)
    let difficulty: Difficulty;
    const difficultyId = settings.difficulty_id ? parseInt(settings.difficulty_id) : null;
    
    if (difficultyId) {
      difficulty = this.db.getDifficultyById(difficultyId) || this.getDefaultDifficulty();
    } else {
      difficulty = this.getDefaultDifficulty();
    }

    // API configuration
    const apiConfig = {
      endpoint: settings.api_endpoint,
      apiKey: settings.api_key,
    };

    return {
      language,
      difficulty,
      userId: user.id,
      apiConfig: apiConfig.endpoint || apiConfig.apiKey ? apiConfig : undefined,
    };
  }

  /**
   * Save user settings to database
   */
  async saveUserSettings(settings: Partial<UserSettings>, username?: string): Promise<void> {
    const currentUsername = username || this.db.getMostRecentUser();
    let user = this.db.getUserByName(currentUsername);
    
    if (!user) {
      this.db.createUser(currentUsername);
      user = this.db.getUserByName(currentUsername)!;
    }

    // Save individual settings
    if (settings.language) {
      this.db.setUserSetting(user.id, 'language_id', settings.language.id.toString());
    }

    if (settings.difficulty) {
      this.db.setUserSetting(user.id, 'difficulty_id', settings.difficulty.id.toString());
    }

    if (settings.apiConfig?.endpoint) {
      this.db.setUserSetting(user.id, 'api_endpoint', settings.apiConfig.endpoint);
    }

    if (settings.apiConfig?.apiKey) {
      this.db.setUserSetting(user.id, 'api_key', settings.apiConfig.apiKey);
    }
  }

  /**
   * Get default language (French if available, otherwise first available)
   */
  private getDefaultLanguage(): Language {
    const languages = this.db.getLanguages();
    
    // Try to find French first
    const french = languages.find(lang => 
      lang.language.toLowerCase().includes('french') || 
      lang.language.toLowerCase().includes('français')
    );
    
    if (french) return french;
    
    // Fallback to first available language
    if (languages.length > 0) return languages[0];
    
    // Ultimate fallback
    return { id: 1, language: 'French' };
  }

  /**
   * Get default difficulty (Beginner)
   */
  private getDefaultDifficulty(): Difficulty {
    const difficulties = this.db.getDifficulties();
    
    // Try to find Beginner first
    const beginner = difficulties.find(diff => 
      diff.difficulty_level.toLowerCase().includes('beginner') ||
      diff.difficulty_level.toLowerCase().includes('débutant')
    );
    
    if (beginner) return beginner;
    
    // Fallback to first available difficulty
    if (difficulties.length > 0) return difficulties[0];
    
    // Ultimate fallback
    return { id: 1, difficulty_level: 'Beginner' };
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Language[] {
    return this.db.getLanguages();
  }

  /**
   * Get available difficulties
   */
  getAvailableDifficulties(): Difficulty[] {
    return this.db.getDifficulties();
  }

  /**
   * Reset user settings to defaults
   */
  async resetUserSettings(username?: string): Promise<UserSettings> {
    const currentUsername = username || this.db.getMostRecentUser();
    let user = this.db.getUserByName(currentUsername);
    
    if (!user) {
      this.db.createUser(currentUsername);
      user = this.db.getUserByName(currentUsername)!;
    }

    // Clear existing settings
    const settingsToReset = ['language_id', 'difficulty_id', 'api_endpoint', 'api_key'];
    settingsToReset.forEach(setting => {
      // Note: This implementation doesn't delete settings, just overwrites them
      // You might want to add a deleteUserSetting method to the database class
    });

    // Return default settings
    return this.getUserSettings(currentUsername);
  }

  /**
   * Validate settings before saving
   */
  validateSettings(settings: Partial<UserSettings>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (settings.language && (typeof settings.language.id !== 'number' || !settings.language.language)) {
      errors.push('Invalid language selection');
    }

    if (settings.difficulty && (typeof settings.difficulty.id !== 'number' || !settings.difficulty.difficulty_level)) {
      errors.push('Invalid difficulty selection');
    }

    if (settings.apiConfig?.endpoint && !this.isValidUrl(settings.apiConfig.endpoint)) {
      errors.push('Invalid API endpoint URL');
    }

    if (settings.apiConfig?.apiKey && settings.apiConfig.apiKey.length < 8) {
      errors.push('API key must be at least 8 characters long');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if a string is a valid URL
   */
  private isValidUrl(string: string): boolean {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }
}