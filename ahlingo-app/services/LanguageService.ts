import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Define types for our language data
export interface Language {
  id: string;
  name: string;
  topics?: string[];
}

class LanguageService {
  private languages: Language[] = [];
  private initialized: boolean = false;

  constructor() {
    // Initialize with hardcoded languages from directory structure
    this.languages = [
      { id: 'French', name: 'French' },
      { id: 'German', name: 'German' },
      { id: 'Spanish', name: 'Spanish' },
      { id: 'Ukrainian', name: 'Ukrainian' }
    ];
  }

  /**
   * Get all available languages
   */
  async getLanguages(): Promise<Language[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    return this.languages;
  }

  /**
   * Initialize the service by reading language directories
   * This could be expanded to read more data from the content files
   */
  private async initialize(): Promise<void> {
    try {
      // On web, we can't use FileSystem, so we'll rely on the hardcoded languages
      if (Platform.OS === 'web') {
        this.initialized = true;
        return;
      }

      // For native platforms, we could read the directories dynamically
      // This would require additional implementation to read the file system
      // For now, we'll use the hardcoded languages
      
      // Example of how we could read directories if needed:
      // const contentDir = FileSystem.documentDirectory + 'assets/language_learning_content/';
      // const dirs = await FileSystem.readDirectoryAsync(contentDir);
      // this.languages = dirs
      //   .filter(dir => !dir.includes('.')) // Filter out files
      //   .map(dir => ({ id: dir, name: dir }));

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize language service:', error);
      // Fall back to hardcoded languages
      this.initialized = true;
    }
  }

  /**
   * Get topics for a specific language
   * This is a placeholder for future implementation
   */
  async getTopicsForLanguage(languageId: string): Promise<string[]> {
    // This would be implemented to read topics from the content structure
    return ['Basics', 'Greetings', 'Food', 'Travel'];
  }
}

// Export a singleton instance
export const languageService = new LanguageService();
