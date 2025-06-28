import { app } from 'electron';
import path from 'path';

/**
 * Get the correct database path for both development and production Electron apps
 */
export function getDatabasePath(): string {
  if (process.env.NODE_ENV === 'development') {
    // Development: use database from repository root
    return path.join(__dirname, '../../../database/languageLearningDatabase.db');
  } else {
    // Production: use database from app resources
    const resourcesPath = process.resourcesPath || app.getPath('exe');
    return path.join(resourcesPath, 'database', 'languageLearningDatabase.db');
  }
}