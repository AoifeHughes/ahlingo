import { Platform } from 'react-native';
import * as RNFS from 'react-native-fs';

export class DatabaseValidator {
  static async validateDatabaseFiles(): Promise<{
    isValid: boolean;
    error?: string;
    details?: {
      bundleExists: boolean;
      documentsExists: boolean;
      bundlePath: string;
      documentsPath: string;
    };
  }> {
    try {
      console.log('Starting database file validation...');
      
      const databaseName = 'languageLearningDatabase.db';
      const bundlePath = Platform.OS === 'ios' 
        ? `${RNFS.MainBundlePath}/${databaseName}`
        : `android_asset/${databaseName}`;
      
      const documentsPath = Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
      
      const databasePath = `${documentsPath}/${databaseName}`;
      
      console.log('Checking database paths:');
      console.log('- Bundle path:', bundlePath);
      console.log('- Documents path:', databasePath);
      
      // Check bundle existence
      let bundleExists = false;
      if (Platform.OS === 'ios') {
        bundleExists = await RNFS.exists(bundlePath);
        console.log('- Bundle exists:', bundleExists);
      } else {
        // For Android, we can't easily check assets, so assume it exists
        bundleExists = true;
        console.log('- Android: assuming bundle exists');
      }
      
      // Check documents directory
      const documentsExists = await RNFS.exists(databasePath);
      console.log('- Documents exists:', documentsExists);
      
      // Validation logic
      if (Platform.OS === 'ios' && !bundleExists) {
        return {
          isValid: false,
          error: 'Database file not found in app bundle. Please reinstall the app.',
          details: { bundleExists, documentsExists, bundlePath, documentsPath: databasePath }
        };
      }
      
      return { 
        isValid: true,
        details: { bundleExists, documentsExists, bundlePath, documentsPath: databasePath }
      };
      
    } catch (error: any) {
      console.error('Database file validation error:', error);
      return {
        isValid: false,
        error: `Database file validation failed: ${error.message}`,
      };
    }
  }
  
  static async ensureDatabaseCopied(): Promise<void> {
    try {
      console.log('Ensuring database is copied...');
      
      const databaseName = 'languageLearningDatabase.db';
      const bundlePath = Platform.OS === 'ios' 
        ? `${RNFS.MainBundlePath}/${databaseName}`
        : `android_asset/${databaseName}`;
      
      const documentsPath = Platform.OS === 'ios'
        ? RNFS.DocumentDirectoryPath
        : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
      
      const databasePath = `${documentsPath}/${databaseName}`;
      
      const exists = await RNFS.exists(databasePath);
      
      if (!exists) {
        console.log('Database not found in documents, copying from bundle...');
        
        if (Platform.OS === 'ios') {
          // Verify bundle exists before copying
          const bundleExists = await RNFS.exists(bundlePath);
          if (!bundleExists) {
            throw new Error('Database file not found in app bundle');
          }
          await RNFS.copyFile(bundlePath, databasePath);
        } else {
          await RNFS.copyFileAssets(databaseName, databasePath);
        }
        
        console.log('Database copied successfully to:', databasePath);
        
        // Verify the copy worked
        const copyExists = await RNFS.exists(databasePath);
        if (!copyExists) {
          throw new Error('Database copy verification failed');
        }
        
        // Check file size to ensure it's not empty
        const stats = await RNFS.stat(databasePath);
        console.log('Copied database size:', stats.size, 'bytes');
        if (stats.size === 0) {
          throw new Error('Copied database file is empty');
        }
        
      } else {
        console.log('Database already exists in documents directory');
        
        // Still check the file size to ensure it's valid
        const stats = await RNFS.stat(databasePath);
        console.log('Existing database size:', stats.size, 'bytes');
        if (stats.size === 0) {
          console.log('Existing database is empty, re-copying...');
          await RNFS.unlink(databasePath);
          await this.ensureDatabaseCopied(); // Recursive call to re-copy
        }
      }
    } catch (error: any) {
      console.error('Failed to copy database:', error);
      throw new Error(`Database copy failed: ${error.message}`);
    }
  }
  
  static async getDatabaseInfo(): Promise<{
    bundlePath: string;
    documentsPath: string;
    bundleExists: boolean;
    documentsExists: boolean;
    documentsSize?: number;
  }> {
    const databaseName = 'languageLearningDatabase.db';
    const bundlePath = Platform.OS === 'ios' 
      ? `${RNFS.MainBundlePath}/${databaseName}`
      : `android_asset/${databaseName}`;
    
    const documentsPath = Platform.OS === 'ios'
      ? RNFS.DocumentDirectoryPath
      : RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
    
    const databasePath = `${documentsPath}/${databaseName}`;
    
    const bundleExists = Platform.OS === 'ios' ? await RNFS.exists(bundlePath) : true;
    const documentsExists = await RNFS.exists(databasePath);
    
    let documentsSize: number | undefined;
    if (documentsExists) {
      try {
        const stats = await RNFS.stat(databasePath);
        documentsSize = stats.size;
      } catch (error) {
        console.warn('Could not get database file size:', error);
      }
    }
    
    return {
      bundlePath,
      documentsPath: databasePath,
      bundleExists,
      documentsExists,
      documentsSize
    };
  }
}