import { LanguageLearningDatabase } from './database';
import { Language, Difficulty, UserSettings } from '../../types';
export declare class UserSettingsService {
    private db;
    constructor(database: LanguageLearningDatabase);
    /**
     * Get complete user settings with fallback defaults
     */
    getUserSettings(username?: string): Promise<UserSettings>;
    /**
     * Save user settings to database
     */
    saveUserSettings(settings: Partial<UserSettings>, username?: string): Promise<void>;
    /**
     * Get default language (French if available, otherwise first available)
     */
    private getDefaultLanguage;
    /**
     * Get default difficulty (Beginner)
     */
    private getDefaultDifficulty;
    /**
     * Get available languages
     */
    getAvailableLanguages(): Language[];
    /**
     * Get available difficulties
     */
    getAvailableDifficulties(): Difficulty[];
    /**
     * Reset user settings to defaults
     */
    resetUserSettings(username?: string): Promise<UserSettings>;
    /**
     * Validate settings before saving
     */
    validateSettings(settings: Partial<UserSettings>): {
        isValid: boolean;
        errors: string[];
    };
    /**
     * Check if a string is a valid URL
     */
    private isValidUrl;
}
//# sourceMappingURL=userSettings.d.ts.map