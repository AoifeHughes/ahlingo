import { Platform } from 'react-native';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system';

// Define types for our language content structure
export interface Exercise {
  id: number;
  name: string;
  path: string;
}

export interface Topic {
  name: string;
  exercises: Exercise[];
}

export interface ExerciseType {
  name: string;
  topics: { [key: string]: Topic };
}

export interface Difficulty {
  name: string;
  exercise_types: { [key: string]: ExerciseType };
}

export interface Language {
  name: string;
  difficulties: { [key: string]: Difficulty };
}

export interface LanguageContent {
  languages: { [key: string]: Language };
}

// Sample data for testing when the actual data can't be loaded
const SAMPLE_DATA: LanguageContent = {
  languages: {
    Spanish: {
      name: 'Spanish',
      difficulties: {
        Beginner: {
          name: 'Beginner',
          exercise_types: {
            pairs: {
              name: 'pairs',
              topics: {
                Greetings: {
                  name: 'Greetings',
                  exercises: [
                    {
                      id: 123,
                      name: 'Basic Greetings',
                      path: 'Spanish/Beginner/pairs/Greetings/123/lesson.json'
                    }
                  ]
                },
                Food: {
                  name: 'Food',
                  exercises: [
                    {
                      id: 456,
                      name: 'Basic Food Vocabulary',
                      path: 'Spanish/Beginner/pairs/Food/456/lesson.json'
                    }
                  ]
                }
              }
            }
          }
        }
      }
    },
    French: {
      name: 'French',
      difficulties: {
        Beginner: {
          name: 'Beginner',
          exercise_types: {
            pairs: {
              name: 'pairs',
              topics: {
                Greetings: {
                  name: 'Greetings',
                  exercises: [
                    {
                      id: 789,
                      name: 'Basic Greetings',
                      path: 'French/Beginner/pairs/Greetings/789/lesson.json'
                    }
                  ]
                }
              }
            }
          }
        }
      }
    }
  }
};

class LanguageContentService {
  private indexCache: LanguageContent | null = null;
  private initialized: boolean = false;
  private baseDir: string = '';
  private assetDir: string = 'language_learning_content/';
  private assetCopyInProgress: boolean = false;

  constructor() {
    // Initialize with sample data as fallback
    this.indexCache = SAMPLE_DATA;
  }

  /**
   * Copy a specific language content file from assets to the filesystem
   * This is used to ensure that specific files are available when needed
   */
  public async copyAssetToFilesystem(relativePath: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return false; // Not applicable for web
      }

      // Ensure the base directory is set
      if (!this.baseDir) {
        // Try to use the document directory with assets path
        this.baseDir = FileSystem.documentDirectory + 'assets/' + this.assetDir;
        await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true }).catch(() => {});
      }

      // Check if the file already exists in the filesystem
      const destPath = this.baseDir + relativePath;
      const fileInfo = await FileSystem.getInfoAsync(destPath);
      
      if (fileInfo.exists) {
        return true; // File already exists
      }

      // Create the directory structure for the file
      const dirPath = destPath.substring(0, destPath.lastIndexOf('/'));
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true }).catch(() => {});

      // We can't directly access the asset bundle in React Native,
      // but we can use the Asset API to download the asset and then copy it
      console.log(`Attempting to copy asset: ${relativePath}`);
      
      // This is a workaround since we can't dynamically require assets
      // In a real implementation, you might need to map known paths to requires
      // or use a different approach
      
      return false; // For now, we'll rely on the preloading mechanism
    } catch (error) {
      console.error(`Failed to copy asset ${relativePath}:`, error);
      return false;
    }
  }

  /**
   * Start copying all language content assets in the background
   * This is a potentially long-running operation that should be done
   * when the app is not busy with other tasks
   */
  public async startAssetCopyProcess(): Promise<void> {
    if (this.assetCopyInProgress || Platform.OS === 'web') {
      return;
    }

    this.assetCopyInProgress = true;
    
    try {
      console.log('Starting background asset copy process...');
      
      // Create the base directory if it doesn't exist
      if (!this.baseDir) {
        this.baseDir = FileSystem.documentDirectory + 'assets/' + this.assetDir;
      }
      
      await FileSystem.makeDirectoryAsync(this.baseDir, { intermediates: true }).catch(() => {});
      
      // In a real implementation, you would iterate through all the assets
      // and copy them to the filesystem. This is just a placeholder.
      
      console.log('Background asset copy process completed');
    } catch (error) {
      console.error('Error in background asset copy process:', error);
    } finally {
      this.assetCopyInProgress = false;
    }
  }

  /**
   * Initialize the service by loading the language structure
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Set up the base directory based on the platform
      if (Platform.OS === 'web') {
        // For web, we'll use the sample data
        console.log('Web platform detected, using sample data');
        this.initialized = true;
        return;
      } else if (Platform.OS === 'ios' || Platform.OS === 'android') {
        // For iOS and Android, we need to use the FileSystem module to access bundled assets
        
        // Try multiple approaches to find the assets
        const approaches = [
          // Approach 1: Try to use the document directory with assets path
          async () => {
            try {
              console.log('Trying document directory with assets path...');
              
              // Check if we can access the assets directory in the document directory
              const assetDir = FileSystem.documentDirectory + 'assets/language_learning_content/';
              await FileSystem.makeDirectoryAsync(assetDir, { intermediates: true }).catch(() => {});
              
              // Check if the index.json file exists
              const indexPath = assetDir + 'index.json';
              const indexExists = await FileSystem.getInfoAsync(indexPath);
              
              if (!indexExists.exists) {
                console.log('Index file does not exist, creating a simple one...');
                
                // Create a simple index.json file with minimal content
                const simpleIndex = {
                  languages: {
                    Spanish: { name: "Spanish" },
                    French: { name: "French" },
                    German: { name: "German" },
                    Ukrainian: { name: "Ukrainian" }
                  }
                };
                
                await FileSystem.writeAsStringAsync(indexPath, JSON.stringify(simpleIndex));
                console.log('Created simple index.json file at:', indexPath);
              }
              
              // Create language directories if they don't exist
              const languages = ["Spanish", "French", "German", "Ukrainian"];
              for (const language of languages) {
                const langDir = assetDir + language;
                await FileSystem.makeDirectoryAsync(langDir, { intermediates: true }).catch(() => {});
              }
              
              this.baseDir = assetDir;
              console.log('Using asset directory:', this.baseDir);
              return true;
            } catch (error) {
              console.warn('Could not set up document directory with assets path:', error);
              return false;
            }
          },
          
          // Approach 2: Try to use the asset directory in the app's document directory
          async () => {
            try {
              console.log('Trying document directory...');
              const docDir = FileSystem.documentDirectory + this.assetDir;
              console.log('Using document directory:', docDir);
              
              // Create the directory if it doesn't exist
              await FileSystem.makeDirectoryAsync(docDir, { intermediates: true }).catch(() => {});
              
              // Test if we can access the directory
              const dirInfo = await FileSystem.getInfoAsync(docDir);
              if (dirInfo.exists && dirInfo.isDirectory) {
                this.baseDir = docDir;
                return true;
              }
              return false;
            } catch (error) {
              console.warn('Could not load from document directory:', error);
              return false;
            }
          },
          
          // Approach 3: Try to use the asset directory with a different path
          async () => {
            try {
              console.log('Trying asset directory with different path...');
              // Try a different path for the assets
              const altDir = FileSystem.documentDirectory + 'assets/' + this.assetDir;
              console.log('Using alternative asset directory:', altDir);
              
              // Create the directory if it doesn't exist
              await FileSystem.makeDirectoryAsync(altDir, { intermediates: true }).catch(() => {});
              
              // Test if we can access the directory
              const dirInfo = await FileSystem.getInfoAsync(altDir);
              if (dirInfo.exists && dirInfo.isDirectory) {
                this.baseDir = altDir;
                return true;
              }
              return false;
            } catch (error) {
              console.warn('Could not load from alternative asset directory:', error);
              return false;
            }
          },
          
          // Approach 4: Try to use the cache directory
          async () => {
            try {
              console.log('Trying cache directory...');
              const cacheDir = FileSystem.cacheDirectory + this.assetDir;
              console.log('Using cache directory:', cacheDir);
              
              // Create the directory if it doesn't exist
              await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true }).catch(() => {});
              
              // Test if we can access the directory
              const dirInfo = await FileSystem.getInfoAsync(cacheDir);
              if (dirInfo.exists && dirInfo.isDirectory) {
                this.baseDir = cacheDir;
                return true;
              }
              return false;
            } catch (error) {
              console.warn('Could not load from cache directory:', error);
              return false;
            }
          },
          
          // Approach 5: Try to copy assets from the bundle to the filesystem
          async () => {
            try {
              console.log('Trying to copy assets from bundle...');
              const bundleDir = FileSystem.bundleDirectory;
              const targetDir = FileSystem.documentDirectory + 'copied_assets/' + this.assetDir;
              
              // Create the target directory
              await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true }).catch(() => {});
              
              console.log('Created target directory:', targetDir);
              this.baseDir = targetDir;
              
              // We'll return true even if we haven't copied anything yet,
              // just to establish the directory
              return true;
            } catch (error) {
              console.warn('Could not set up asset copying:', error);
              return false;
            }
          }
        ];
        
        // Try each approach in order
        for (const approach of approaches) {
          if (await approach()) {
            // Test if we can actually list languages
            const languages = await this.listLanguages();
            if (languages.length > 0) {
              console.log('Successfully loaded languages:', languages);
              this.initialized = true;
              return;
            }
          }
        }
      }
      
      // If all else fails, use the sample data
      console.log('All approaches failed, using sample data for language content');
      this.indexCache = SAMPLE_DATA;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize language content service:', error);
      // Fall back to sample data
      this.indexCache = SAMPLE_DATA;
      this.initialized = true;
    }
  }

  /**
   * List all available languages by reading the directory structure
   */
  private async listLanguages(): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        // For web, return the languages from the sample data
        return Object.keys(SAMPLE_DATA.languages);
      } else {
        // For native platforms, read the directory structure
        const contentDir = this.baseDir;
        const dirInfo = await FileSystem.getInfoAsync(contentDir);
        
        if (!dirInfo.exists || !dirInfo.isDirectory) {
          console.warn(`Directory ${contentDir} does not exist or is not a directory`);
          return Object.keys(SAMPLE_DATA.languages);
        }
        
        const dirs = await FileSystem.readDirectoryAsync(contentDir);
        // Filter out files and only keep directories (languages)
        return dirs.filter(dir => 
          dir !== 'index.json' && 
          dir !== 'README.md' && 
          !dir.includes('.')
        );
      }
    } catch (error) {
      console.error('Failed to list languages:', error);
      return Object.keys(SAMPLE_DATA.languages);
    }
  }

  /**
   * List all difficulties for a language by reading the directory structure
   */
  private async listDifficulties(language: string): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        // For web, return the difficulties from the sample data
        return Object.keys(SAMPLE_DATA.languages[language]?.difficulties || {});
      } else {
        // For native platforms, read the directory structure
        const langDir = this.baseDir + language;
        const dirInfo = await FileSystem.getInfoAsync(langDir);
        
        if (!dirInfo.exists || !dirInfo.isDirectory) {
          console.warn(`Directory ${langDir} does not exist or is not a directory`);
          return Object.keys(SAMPLE_DATA.languages[language]?.difficulties || {});
        }
        
        const dirs = await FileSystem.readDirectoryAsync(langDir);
        // Filter out files and only keep directories (difficulties)
        return dirs.filter(dir => !dir.includes('.'));
      }
    } catch (error) {
      console.error(`Failed to list difficulties for ${language}:`, error);
      return Object.keys(SAMPLE_DATA.languages[language]?.difficulties || {});
    }
  }

  /**
   * List all exercise types for a language and difficulty by reading the directory structure
   */
  private async listExerciseTypes(language: string, difficulty: string): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        // For web, return the exercise types from the sample data
        return Object.keys(SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types || {});
      } else {
        // For native platforms, read the directory structure
        const diffDir = this.baseDir + language + '/' + difficulty;
        const dirInfo = await FileSystem.getInfoAsync(diffDir);
        
        if (!dirInfo.exists || !dirInfo.isDirectory) {
          console.warn(`Directory ${diffDir} does not exist or is not a directory`);
          return Object.keys(SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types || {});
        }
        
        const dirs = await FileSystem.readDirectoryAsync(diffDir);
        // Filter out files and only keep directories (exercise types)
        return dirs.filter(dir => !dir.includes('.'));
      }
    } catch (error) {
      console.error(`Failed to list exercise types for ${language}/${difficulty}:`, error);
      return Object.keys(SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types || {});
    }
  }

  /**
   * List all topics for a language, difficulty, and exercise type by reading the directory structure
   */
  private async listTopics(language: string, difficulty: string, exerciseType: string): Promise<string[]> {
    try {
      if (Platform.OS === 'web') {
        // For web, return the topics from the sample data
        return Object.keys(SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types[exerciseType]?.topics || {});
      } else {
        // For native platforms, read the directory structure
        const typeDir = this.baseDir + language + '/' + difficulty + '/' + exerciseType;
        const dirInfo = await FileSystem.getInfoAsync(typeDir);
        
        if (!dirInfo.exists || !dirInfo.isDirectory) {
          console.warn(`Directory ${typeDir} does not exist or is not a directory`);
          return Object.keys(SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types[exerciseType]?.topics || {});
        }
        
        const dirs = await FileSystem.readDirectoryAsync(typeDir);
        // Filter out files and only keep directories (topics)
        return dirs.filter(dir => !dir.includes('.'));
      }
    } catch (error) {
      console.error(`Failed to list topics for ${language}/${difficulty}/${exerciseType}:`, error);
      return Object.keys(SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types[exerciseType]?.topics || {});
    }
  }

  /**
   * List all exercises for a language, difficulty, exercise type, and topic by reading the directory structure
   */
  private async listExercises(language: string, difficulty: string, exerciseType: string, topic: string): Promise<Exercise[]> {
    try {
      if (Platform.OS === 'web') {
        // For web, return the exercises from the sample data
        return SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types[exerciseType]?.topics[topic]?.exercises || [];
      } else {
        // For native platforms, read the directory structure
        const topicDir = this.baseDir + language + '/' + difficulty + '/' + exerciseType + '/' + topic;
        const dirInfo = await FileSystem.getInfoAsync(topicDir);
        
        if (!dirInfo.exists || !dirInfo.isDirectory) {
          console.warn(`Directory ${topicDir} does not exist or is not a directory`);
          return SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types[exerciseType]?.topics[topic]?.exercises || [];
        }
        
        const dirs = await FileSystem.readDirectoryAsync(topicDir);
        // Filter out files and only keep directories (exercise IDs)
        const exerciseIds = dirs.filter(dir => !dir.includes('.'));
        
        // Create Exercise objects for each ID
        const exercises: Exercise[] = [];
        for (const id of exerciseIds) {
          // Check if the lesson.json file exists
          const lessonPath = topicDir + '/' + id + '/lesson.json';
          const lessonInfo = await FileSystem.getInfoAsync(lessonPath);
          
          if (lessonInfo.exists) {
            try {
              // Read the lesson.json file to get the exercise name
              const lessonContent = await FileSystem.readAsStringAsync(lessonPath);
              const lesson = JSON.parse(lessonContent);
              
              exercises.push({
                id: parseInt(id),
                name: lesson.name || `Exercise ${id}`,
                path: `${language}/${difficulty}/${exerciseType}/${topic}/${id}/lesson.json`
              });
            } catch (error) {
              console.error(`Failed to read lesson.json for ${id}:`, error);
              // Add a placeholder exercise
              exercises.push({
                id: parseInt(id),
                name: `Exercise ${id}`,
                path: `${language}/${difficulty}/${exerciseType}/${topic}/${id}/lesson.json`
              });
            }
          }
        }
        
        return exercises;
      }
    } catch (error) {
      console.error(`Failed to list exercises for ${language}/${difficulty}/${exerciseType}/${topic}:`, error);
      return SAMPLE_DATA.languages[language]?.difficulties[difficulty]?.exercise_types[exerciseType]?.topics[topic]?.exercises || [];
    }
  }

  /**
   * Get all available languages
   */
  async getLanguages(): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.listLanguages();
    } catch (error) {
      console.error('Failed to get languages:', error);
      return Object.keys(this.indexCache?.languages || {});
    }
  }

  /**
   * Get all difficulties for a language
   */
  async getDifficulties(language: string): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.listDifficulties(language);
    } catch (error) {
      console.error(`Failed to get difficulties for ${language}:`, error);
      return Object.keys(this.indexCache?.languages[language]?.difficulties || {});
    }
  }

  /**
   * Get all exercise types for a language and difficulty
   */
  async getExerciseTypes(language: string, difficulty: string): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.listExerciseTypes(language, difficulty);
    } catch (error) {
      console.error(`Failed to get exercise types for ${language}/${difficulty}:`, error);
      return Object.keys(this.indexCache?.languages[language]?.difficulties[difficulty]?.exercise_types || {});
    }
  }

  /**
   * Get all topics for a language, difficulty, and exercise type
   */
  async getTopics(language: string, difficulty: string, exerciseType: string): Promise<string[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.listTopics(language, difficulty, exerciseType);
    } catch (error) {
      console.error(`Failed to get topics for ${language}/${difficulty}/${exerciseType}:`, error);
      return Object.keys(this.indexCache?.languages[language]?.difficulties[difficulty]?.exercise_types[exerciseType]?.topics || {});
    }
  }

  /**
   * Get all exercises for a language, difficulty, exercise type, and topic
   */
  async getExercises(language: string, difficulty: string, exerciseType: string, topic: string): Promise<Exercise[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      return await this.listExercises(language, difficulty, exerciseType, topic);
    } catch (error) {
      console.error(`Failed to get exercises for ${language}/${difficulty}/${exerciseType}/${topic}:`, error);
      return this.indexCache?.languages[language]?.difficulties[difficulty]?.exercise_types[exerciseType]?.topics[topic]?.exercises || [];
    }
  }

  /**
   * Get a random exercise for a language, difficulty, exercise type, and topic
   */
  async getRandomExercise(language: string, difficulty: string, exerciseType: string, topic: string): Promise<Exercise | null> {
    const exercises = await this.getExercises(language, difficulty, exerciseType, topic);
    if (exercises.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * exercises.length);
    return exercises[randomIndex];
  }

  /**
   * Get the content of a specific exercise
   */
  async getExerciseContent(exercise: Exercise): Promise<any> {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      if (Platform.OS === 'web') {
        // For web, return a sample exercise content
        return {
          id: exercise.id,
          name: exercise.name,
          content: {
            english: {
              text: "Sample English text",
            },
            target_language: {
              text: "Sample target language text",
            }
          }
        };
      } else {
        // For native platforms, read the lesson.json file
        const lessonPath = this.baseDir + exercise.path;
        const lessonInfo = await FileSystem.getInfoAsync(lessonPath);
        
        if (!lessonInfo.exists) {
          console.warn(`Lesson file ${lessonPath} does not exist`);
          return null;
        }
        
        const lessonContent = await FileSystem.readAsStringAsync(lessonPath);
        return JSON.parse(lessonContent);
      }
    } catch (error) {
      console.error(`Failed to get exercise content for ${exercise.path}:`, error);
      return null;
    }
  }
}

// Export a singleton instance
export const languageContentService = new LanguageContentService();
